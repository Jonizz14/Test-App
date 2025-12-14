from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from .models import User, Test, Question, TestAttempt, Feedback, TestSession, Pricing, StarPackage, Gift, StudentGift
from .serializers import UserSerializer, TestSerializer, QuestionSerializer, TestAttemptSerializer, FeedbackSerializer, TestSessionSerializer, PricingSerializer, StarPackageSerializer, GiftSerializer, StudentGiftSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def update(self, request, *args, **kwargs):
        # Allow partial updates for PUT requests too
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = None
        if '@' in username:
            user = authenticate(username=username, password=password)
        else:
            try:
                user_obj = User.objects.filter(display_id=username).first()
                if user_obj:
                    user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None
        
        if user:
            user.last_login = timezone.now()
            user.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        return Response({'error': 'Email yoki parol noto\'g\'ri'}, status=status.HTTP_401_UNAUTHORIZED)

    @action(detail=False, methods=['post'])
    def register(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user.set_password(request.data['password'])
            user.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



    @action(detail=True, methods=['post'])
    def give_stars(self, request, pk=None):
        """Teacher or seller gives stars to a student (adds to earnings)"""
        if request.user.role not in ['teacher', 'seller']:
            return Response({'error': 'Only teachers and sellers can give stars'}, status=status.HTTP_403_FORBIDDEN)

        student = self.get_object()
        if student.role != 'student':
            return Response({'error': 'Stars can only be given to students'}, status=status.HTTP_400_BAD_REQUEST)

        stars_to_give = request.data.get('stars', 1)
        if not isinstance(stars_to_give, int) or stars_to_give <= 0:
            return Response({'error': 'Invalid number of stars'}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate earnings: $0.10 per star
        from decimal import Decimal
        earnings_per_star = Decimal('0.10')
        total_earnings = stars_to_give * earnings_per_star

        # Add stars to student
        student.stars += stars_to_give
        try:
            student.save()
        except Exception as e:
            return Response({'error': 'Failed to save student stars'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Add earnings to teacher
        request.user.seller_earnings += total_earnings
        try:
            request.user.save()
        except Exception as e:
            # Don't return error here, stars were already saved
            pass

        serializer = UserSerializer(student)
        return Response({
            'student': serializer.data,
            'stars_given': stars_to_give,
            'teacher_earnings_added': total_earnings
        })

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def toggle_premium(self, request, pk=None):
        """Toggle premium status for a student (admin and seller only)"""
        if request.user.role not in ['admin', 'seller']:
            return Response({'error': 'Only admin and seller can manage premium status'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        if user.role != 'student':
            return Response({'error': 'Premium status can only be managed for students'}, status=status.HTTP_400_BAD_REQUEST)

        user.is_premium = not user.is_premium
        if user.is_premium:
            from django.utils import timezone
            user.premium_granted_date = timezone.now()
            user.premium_emoji_count = 50 
        else:
            user.premium_granted_date = None
            user.premium_emoji_count = 0

        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def grant_premium(self, request, pk=None):
        """Grant premium status to a student (admin and seller only)"""
        if request.user.role not in ['admin', 'seller']:
            return Response({'error': 'Only admin and seller can grant premium status'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        if user.role != 'student':
            return Response({'error': 'Premium status can only be granted to students'}, status=status.HTTP_400_BAD_REQUEST)

        # Get premium type from request (default to time_based)
        premium_type = request.data.get('premium_type', 'time_based')
        
        if premium_type == 'time_based':
            # Time-based premium with pricing plan
            pricing_id = request.data.get('pricing_id')
            if not pricing_id:
                return Response({'error': 'pricing_id is required for time-based premium'}, status=status.HTTP_400_BAD_REQUEST)

            try:
                pricing = Pricing.objects.get(id=pricing_id, is_active=True)
            except Pricing.DoesNotExist:
                return Response({'error': 'Invalid pricing plan'}, status=status.HTTP_400_BAD_REQUEST)

            # Calculate expiry date based on plan type
            from django.utils import timezone
            now = timezone.now()
            if pricing.plan_type == 'week':
                expiry_date = now + timezone.timedelta(weeks=1)
            elif pricing.plan_type == 'month':
                expiry_date = now + timezone.timedelta(days=30)
            elif pricing.plan_type == 'year':
                expiry_date = now + timezone.timedelta(days=365)
            else:
                return Response({'error': 'Invalid plan type'}, status=status.HTTP_400_BAD_REQUEST)

            user.is_premium = True
            user.premium_type = 'time_based'
            user.premium_granted_date = now
            user.premium_expiry_date = expiry_date
            user.premium_plan = pricing.plan_type
            user.premium_cost = pricing.discounted_price
            user.premium_balance = 0  # No balance for time-based premium
            user.premium_emoji_count = 50  # Grant premium emojis
            user.save()

            # Add commission to seller earnings (10% of discounted price)
            commission = pricing.discounted_price * 0.1
            request.user.seller_earnings += commission
            request.user.save()

            serializer = UserSerializer(user)
            return Response({
                'user': serializer.data,
                'premium_type': 'time_based',
                'pricing': {
                    'plan_name': pricing.get_plan_type_display(),
                    'cost': pricing.discounted_price,
                    'expiry_date': expiry_date,
                    'seller_commission': commission
                }
            })
        
        elif premium_type == 'performance_based':
            # Performance-based premium (granted automatically for high scores)
            from django.utils import timezone
            now = timezone.now()
            
            user.is_premium = True
            user.premium_type = 'performance_based'
            user.premium_granted_date = now
            user.premium_expiry_date = None  # No expiry for performance-based
            user.premium_plan = 'performance'
            user.premium_cost = 0  # Free for performance
            user.premium_balance = 1000  # Start with 1000 premium points
            user.premium_emoji_count = 50  # Grant premium emojis
            user.save()

            serializer = UserSerializer(user)
            return Response({
                'user': serializer.data,
                'premium_type': 'performance_based',
                'message': 'Performance-based premium granted! Premium will be active while balance > 0 and average score >= 95%'
            })
        
        else:
            return Response({'error': 'Invalid premium type. Use "time_based" or "performance_based"'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def revoke_premium(self, request, pk=None):
        """Revoke premium status from a student (admin and seller only)"""
        if request.user.role not in ['admin', 'seller']:
            return Response({'error': 'Only admin and seller can revoke premium status'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        if user.role != 'student':
            return Response({'error': 'Premium status can only be revoked from students'}, status=status.HTTP_400_BAD_REQUEST)

        # Revoke all premium features
        user.is_premium = False
        user.premium_granted_date = None
        user.premium_expiry_date = None
        user.premium_plan = ''
        user.premium_cost = 0
        user.premium_type = 'time_based'  # Reset to default
        user.premium_balance = 0
        user.premium_emoji_count = 0
        user.save()

        serializer = UserSerializer(user)
        return Response({
            'user': serializer.data,
            'message': 'Premium status revoked successfully'
        })

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_list(self, request):
        """Public endpoint to get all tests (for questions page)"""
        queryset = Test.objects.filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def get_queryset(self):
        queryset = Test.objects.all()
        subject = self.request.query_params.get('subject', None)
        teacher = self.request.query_params.get('teacher', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        if teacher:
            queryset = queryset.filter(teacher=teacher)  # Fixed: use teacher instead of teacher_id

        # Filter tests for students based on their class_group
        if self.request.user.role == 'student':
            # For students, only show tests that are specifically assigned to their class
            class_group = self.request.user.class_group
            if class_group:
                # Extract grade from class_group (e.g., "9-01" -> "9")
                student_grade = class_group.split('-')[0] if '-' in class_group else class_group

                # Only show tests where the student's grade is in target_grades
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(target_grades__icontains=student_grade) |  # Grade in target_grades string
                    Q(target_grades='')     # Empty means all grades
                ).filter(is_active=True)
            else:
                # If no class_group, don't show any tests
                queryset = queryset.none()
        return queryset

    def perform_update(self, serializer):
        # Allow admin to update any test, others only their own
        if self.request.user.role != 'admin' and self.get_object().teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Siz faqat o'zingiz yaratgan testlarni tahrirlay olasiz")
        serializer.save()

    def perform_destroy(self, instance):
        # Allow admin to delete any test, others only their own
        if self.request.user.role != 'admin' and instance.teacher != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Siz faqat o'zingiz yaratgan testlarni o'chira olasiz")
        instance.delete()

class QuestionViewSet(viewsets.ModelViewSet):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Question.objects.all()
        test_id = self.request.query_params.get('test', None)
        if test_id:
            queryset = queryset.filter(test_id=test_id)
        return queryset

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def public_list(self, request):
        """Public endpoint to get all questions (for questions page)"""
        queryset = Question.objects.all()
        test_id = request.query_params.get('test', None)
        if test_id:
            queryset = queryset.filter(test_id=test_id)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class TestAttemptViewSet(viewsets.ModelViewSet):
    queryset = TestAttempt.objects.all()
    serializer_class = TestAttemptSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    def get_queryset(self):
        queryset = TestAttempt.objects.all()
        student = self.request.query_params.get('student', None)
        test = self.request.query_params.get('test', None)
        if student:
            queryset = queryset.filter(student_id=student)
        if test:
            queryset = queryset.filter(test_id=test)
        return queryset

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

class TestSessionViewSet(viewsets.ModelViewSet):
    queryset = TestSession.objects.all()
    serializer_class = TestSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TestSession.objects.all()
        student = self.request.query_params.get('student', None)
        test = self.request.query_params.get('test', None)
        session_id = self.request.query_params.get('session_id', None)
        active_only = self.request.query_params.get('active_only', None)
        
        if student:
            queryset = queryset.filter(student_id=student)
        if test:
            queryset = queryset.filter(test_id=test)
        if session_id:
            queryset = queryset.filter(session_id=session_id)
        
        # Only return active sessions if requested
        if active_only == 'true':
            from django.utils import timezone
            now = timezone.now()
            queryset = queryset.filter(
                is_completed=False,
                is_expired=False,
                expires_at__gt=now
            )
            
        return queryset

    @action(detail=False, methods=['post'])
    def start_session(self, request):
        """Start a new test session"""
        test_id = request.data.get('test_id')
        if not test_id:
            return Response({'error': 'test_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            test = Test.objects.get(id=test_id, is_active=True)
        except Test.DoesNotExist:
            return Response({'error': 'Test not found or inactive'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if student already has an attempt for this test
        existing_attempt = TestAttempt.objects.filter(student=request.user, test=test).first()
        if existing_attempt:
            return Response({'error': 'Test already completed'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check for existing active session
        existing_session = TestSession.objects.filter(
            student=request.user, 
            test=test, 
            is_completed=False,
            is_expired=False
        ).first()
        
        if existing_session:
            # Return existing session
            serializer = self.get_serializer(existing_session)
            return Response(serializer.data)
        
        # Create new session
        from django.utils import timezone
        import uuid
        
        now = timezone.now()
        expires_at = now + timezone.timedelta(minutes=test.time_limit)
        
        session = TestSession.objects.create(
            session_id=str(uuid.uuid4()),
            test=test,
            student=request.user,
            started_at=now,
            expires_at=expires_at,
            answers={}
        )
        
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def get_session(self, request):
        """Get an existing test session by session_id"""
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = TestSession.objects.get(session_id=session_id, student=request.user)
            
            # Check if session has expired
            if session.is_expired or session.time_remaining <= 0:
                session.mark_expired()
                return Response({'error': 'Test session has expired'}, status=status.HTTP_410_GONE)
            
            # Check if session is completed
            if session.is_completed:
                return Response({'error': 'Test already completed'}, status=status.HTTP_400_BAD_REQUEST)
            
            serializer = self.get_serializer(session)
            return Response(serializer.data)
            
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['put'])
    def update_answers(self, request):
        """Update answers in a test session"""
        session_id = request.data.get('session_id')
        answers = request.data.get('answers', {})

        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = TestSession.objects.get(session_id=session_id, student=request.user)

            # Check if session is still active
            if session.is_expired or session.time_remaining <= 0:
                session.mark_expired()
                return Response({'error': 'Test session has expired'}, status=status.HTTP_410_GONE)

            if session.is_completed:
                return Response({'error': 'Test already completed'}, status=status.HTTP_400_BAD_REQUEST)

            # Update answers
            session.answers.update(answers)
            session.save()

            serializer = self.get_serializer(session)
            return Response(serializer.data)

        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def complete_session(self, request):
        """Complete a test session and create attempt record"""
        session_id = request.data.get('session_id')

        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = TestSession.objects.get(session_id=session_id, student=request.user)

            if session.is_completed:
                return Response({'error': 'Test already completed'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if session has expired
            is_expired = session.is_expired or session.time_remaining <= 0
            if is_expired and not session.is_expired:
                session.mark_expired()

            # Calculate score based on saved answers
            questions = session.test.questions.all()
            correct_answers = 0
            total_questions = questions.count()

            for question in questions:
                user_answer = session.answers.get(str(question.id), '')
                if user_answer and user_answer.lower().strip() == question.correct_answer.lower().strip():
                    correct_answers += 1

            score = (correct_answers / total_questions * 100) if total_questions > 0 else 0

            # Calculate time taken
            from django.utils import timezone
            if is_expired:
                # For expired sessions, use the full time limit
                time_taken = session.test.time_limit
            else:
                # For manually completed sessions, calculate actual time taken
                time_taken = int((timezone.now() - session.started_at).total_seconds() / 60)

            # Create attempt record
            attempt = TestAttempt.objects.create(
                student=session.student,
                test=session.test,
                answers=session.answers,
                score=score,
                time_taken=time_taken
            )

            # Mark session as completed
            session.complete()

            message = 'Test completed successfully'
            if is_expired:
                message = 'Test auto-completed due to time expiry'

            return Response({
                'success': True,
                'score': score,
                'attempt_id': attempt.id,
                'message': message,
                'expired': is_expired
            })

        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

class GiftViewSet(viewsets.ModelViewSet):
    queryset = Gift.objects.all()
    serializer_class = GiftSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only allow admin and seller to manage gifts"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        """Only return active gifts for non-admin users"""
        if self.request.user.role in ['admin', 'seller']:
            return Gift.objects.all()
        return Gift.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage gifts")
        return serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage gifts")
        return serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage gifts")
        instance.delete()

class StudentGiftViewSet(viewsets.ModelViewSet):
    queryset = StudentGift.objects.all()
    serializer_class = StudentGiftSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = StudentGift.objects.all()
        student = self.request.query_params.get('student', None)
        if student:
            queryset = queryset.filter(student_id=student)
        return queryset

    @action(detail=False, methods=['post'])
    def purchase_gift(self, request):
        """Student purchases a gift with stars"""
        gift_id = request.data.get('gift_id')
        if not gift_id:
            return Response({'error': 'gift_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            gift = Gift.objects.get(id=gift_id, is_active=True)
        except Gift.DoesNotExist:
            return Response({'error': 'Gift not found or inactive'}, status=status.HTTP_404_NOT_FOUND)

        student = request.user
        if student.role != 'student':
            return Response({'error': 'Only students can purchase gifts'}, status=status.HTTP_403_FORBIDDEN)

        if student.stars < gift.star_cost:
            return Response({'error': 'Not enough stars to purchase this gift'}, status=status.HTTP_400_BAD_REQUEST)

        # Deduct stars and create purchase record
        student.stars -= gift.star_cost
        student.save()

        # Find the first available position (1, 2, or 3)
        placed_positions = StudentGift.objects.filter(
            student=student,
            is_placed=True
        ).values_list('placement_position', flat=True)

        available_position = None
        for pos in [1, 2, 3]:
            if pos not in placed_positions:
                available_position = pos
                break

        # Create the gift and place it if there's an available position
        student_gift = StudentGift.objects.create(
            student=student,
            gift=gift,
            is_placed=available_position is not None,
            placement_position=available_position
        )

        serializer = self.get_serializer(student_gift)
        return Response({
            'message': 'Gift purchased successfully',
            'student_gift': serializer.data,
            'remaining_stars': student.stars
        })

    @action(detail=True, methods=['post'])
    def place_gift(self, request, pk=None):
        """Place or remove a gift on student's profile"""
        student_gift = self.get_object()
        if student_gift.student != request.user:
            return Response({'error': 'You can only manage your own gifts'}, status=status.HTTP_403_FORBIDDEN)

        position = request.data.get('position')  # 1, 2, or 3, or null to remove

        if position is not None:
            if position not in [1, 2, 3]:
                return Response({'error': 'Position must be 1, 2, or 3'}, status=status.HTTP_400_BAD_REQUEST)

            # Check if position is already taken
            existing = StudentGift.objects.filter(
                student=request.user,
                placement_position=position,
                is_placed=True
            ).exclude(id=student_gift.id).first()

            if existing:
                return Response({'error': f'Position {position} is already occupied'}, status=status.HTTP_400_BAD_REQUEST)

        # Update placement
        student_gift.is_placed = position is not None
        student_gift.placement_position = position
        student_gift.save()

        serializer = self.get_serializer(student_gift)
        message = f'Gift placed at position {position}' if position is not None else 'Gift removed from profile'
        return Response({
            'message': message,
            'student_gift': serializer.data
        })

    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def my_gifts(self, request):
        """Get user's gifts"""
        student_id = request.query_params.get('student')
        if not student_id:
            student_id = request.user.id
        gifts = StudentGift.objects.filter(student_id=student_id)
        serializer = self.get_serializer(gifts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def placed_gifts(self, request):
        """Get gifts placed on current user's profile"""
        gifts = StudentGift.objects.filter(
            student=request.user,
            is_placed=True
        ).order_by('placement_position')
        serializer = self.get_serializer(gifts, many=True)
        return Response(serializer.data)



class PricingViewSet(viewsets.ModelViewSet):
    queryset = Pricing.objects.all()
    serializer_class = PricingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only allow admin and seller to manage pricing"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        """Only return active pricing for non-admin users"""
        if self.request.user.role in ['admin', 'seller']:
            return Pricing.objects.all()
        return Pricing.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage pricing")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage pricing")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage pricing")
        instance.delete()

class StarPackageViewSet(viewsets.ModelViewSet):
    queryset = StarPackage.objects.all()
    serializer_class = StarPackageSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only allow admin and seller to manage star packages"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_queryset(self):
        """Only return active star packages for non-admin users"""
        if self.request.user.role in ['admin', 'seller']:
            return StarPackage.objects.all()
        return StarPackage.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage star packages")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage star packages")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage star packages")
        instance.delete()

    @action(detail=False, methods=['post'])
    def auto_expire_sessions(self, request):
        """Auto-expire sessions that have run out of time"""
        from django.utils import timezone
        
        now = timezone.now()
        expired_sessions = TestSession.objects.filter(
            is_completed=False,
            is_expired=False,
            expires_at__lte=now
        )
        
        count = 0
        for session in expired_sessions:
            session.mark_expired()
            count += 1
        
        return Response({'expired_count': count})

    def perform_create(self, serializer):
        # Only allow authenticated users to create sessions
        serializer.save(student=self.request.user)

