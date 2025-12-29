import time
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from .models import User, Test, Question, TestAttempt, Feedback, TestSession, Pricing, StarPackage, ContactMessage
from .serializers import UserSerializer, TestSerializer, QuestionSerializer, TestAttemptSerializer, FeedbackSerializer, TestSessionSerializer, PricingSerializer, StarPackageSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = User.objects.all()

        # Apply admin isolation for admin users
        if self.request.user.is_authenticated and self.request.user.role in ['admin', 'head_admin']:
            if self.request.user.role == 'head_admin':
                # Head admin can see all users
                pass
            else:
                # Regular admin can only see users they created
                queryset = queryset.filter(
                    models.Q(created_by_admin=self.request.user) |
                    models.Q(id=self.request.user.id)  # Can see themselves
                )

        # Apply teacher isolation - teachers can only see students created by their admin
        elif self.request.user.is_authenticated and self.request.user.role == 'teacher':
            if self.request.user.created_by_admin:
                # Teacher can only see students created by their admin
                queryset = queryset.filter(
                    models.Q(created_by_admin=self.request.user.created_by_admin) |
                    models.Q(id=self.request.user.id)  # Can see themselves
                )
            else:
                # If teacher has no admin, only see themselves
                queryset = queryset.filter(id=self.request.user.id)

        # Apply student isolation - students can only see users created by their admin
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            if self.request.user.created_by_admin:
                # Student can only see users created by their admin
                queryset = queryset.filter(
                    models.Q(created_by_admin=self.request.user.created_by_admin) |
                    models.Q(id=self.request.user.id)  # Can see themselves
                )
            else:
                # If student has no admin, only see themselves
                queryset = queryset.filter(id=self.request.user.id)

        return queryset

    def update(self, request, *args, **kwargs):
        # Allow partial updates for PUT requests too
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        # Check limits for free plan admins
        if request.user.is_authenticated and request.user.role == 'admin' and not request.user.is_premium:
            role = request.data.get('role')
            if role == 'student':
                # Free plan: max 10 students
                student_count = User.objects.filter(created_by_admin=request.user, role='student').count()
                if student_count >= 10:
                    return Response({'error': 'Bepul tarifda maksimum 10 ta o\'quvchi yaratish mumkin'}, status=status.HTTP_400_BAD_REQUEST)
            elif role == 'teacher':
                # Free plan: max 5 teachers
                teacher_count = User.objects.filter(created_by_admin=request.user, role='teacher').count()
                if teacher_count >= 5:
                    return Response({'error': 'Bepul tarifda maksimum 5 ta o\'qituvchi yaratish mumkin'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate password and username if not provided
        data = request.data.copy()
        if 'password' not in data or not data['password']:
            # Use a temporary password, will be changed to display_id later
            data['password'] = 'temp_password'

        if 'username' not in data or not data['username']:
            data['username'] = f"temp_{User.objects.count() + 1}"

        print(f"Creating user with data: {data}")  # Debug logging

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            print(f"User created: {user.username}, display_id: {user.display_id}, password: {data['password']}")  # Debug logging

            # Set created_by_admin if the creator is an admin
            if request.user.is_authenticated and request.user.role in ['admin', 'head_admin']:
                user.created_by_admin = request.user if request.user.role == 'admin' else None
                # Force regeneration of display_id with admin prefix
                user.display_id = ''
                user.username = f"temp_{user.id}"
                user.save()
                print(f"Set created_by_admin to: {user.created_by_admin}")  # Debug logging

            # Set password after all user data is finalized
            if user.role == 'admin' and 'password' in data and data['password'] and data['password'] != 'temp_password':
                user.set_password(data['password'])
            else:
                # Set password to display_id for easy login
                user.set_password(user.display_id)
            user.save()

            # Return user data with appropriate password for frontend
            user_data = UserSerializer(user).data
            if user.role == 'admin' and 'password' in data and data['password'] and data['password'] != 'temp_password':
                user_data['generated_password'] = data['password']
            else:
                user_data['generated_password'] = user.display_id
            return Response(user_data, status=status.HTTP_201_CREATED)
        print(f"Serializer errors: {serializer.errors}")  # Debug logging
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = None
        # First try to authenticate directly with username
        user = authenticate(username=username, password=password)

        # If that fails, try to find by display_id and authenticate with the actual username
        if not user:
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
        data = request.data.copy()

        # For admin registration, set role to admin and handle organization
        if data.get('role') == 'admin':
            data['role'] = 'admin'
            # Organization is already in the data

        serializer = self.get_serializer(data=data)
        if serializer.is_valid():
            user = serializer.save()
            # Use the provided password for admin registration
            user.set_password(data['password'])

            user.save()

            # For admin registration, don't return tokens - they need to choose a plan first
            if data.get('role') == 'admin':
                user_data = UserSerializer(user).data
                user_data['generated_password'] = data['password']  # Use provided password
                return Response({
                    'user': user_data,
                    'message': 'Admin ro\'yxatdan o\'tdi. Tarifni tanlash kerak.'
                }, status=status.HTTP_201_CREATED)

            # For other roles, return tokens
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def select_plan(self, request):
        """Allow admin to select a pricing plan"""
        if request.user.role != 'admin':
            return Response({'error': 'Only admins can select plans'}, status=status.HTTP_403_FORBIDDEN)

        plan_type = request.data.get('plan_type')
        if not plan_type:
            return Response({'error': 'plan_type is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        if plan_type == 'free':
            # Free plan - no premium features, immediately approved
            user.is_premium = False
            user.admin_premium_plan = 'free'
            user.admin_premium_pending = False
            user.admin_premium_approved = True
            user.admin_premium_granted_date = timezone.now()
            user.admin_premium_cost = 0
            user.save()
        elif plan_type in ['basic', 'premium']:
            # Paid plans - set as pending approval
            user.admin_premium_plan = plan_type
            user.admin_premium_pending = True
            user.admin_premium_approved = False
            user.is_premium = False  # Not premium until approved
            if plan_type == 'basic':
                user.admin_premium_cost = 9.99
            elif plan_type == 'premium':
                user.admin_premium_cost = 19.99
            user.save()

            # Send notification to head admin
            self._send_admin_plan_notification(user, plan_type)
        else:
            return Response({'error': 'Invalid plan type'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f'{plan_type} plan selected successfully',
            'user': UserSerializer(user).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_plan(self, request, pk=None):
        """Head admin approves a pending admin premium plan"""
        if request.user.role != 'head_admin':
            return Response({'error': 'Only head admin can approve plans'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        if user.role != 'admin':
            return Response({'error': 'Can only approve admin plans'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.admin_premium_pending:
            return Response({'error': 'No pending plan to approve'}, status=status.HTTP_400_BAD_REQUEST)

        # Approve the plan
        user.admin_premium_pending = False
        user.admin_premium_approved = True
        user.is_premium = True
        user.admin_premium_granted_date = timezone.now()
        user.save()

        serializer = UserSerializer(user)
        return Response({
            'message': f'{user.admin_premium_plan} plan approved for {user.name}',
            'user': serializer.data
        })
    
    def _send_admin_plan_notification(self, admin_user, plan_type):
        """Send notification to head admin when an admin selects a plan"""
        try:
            # Get all head admins
            head_admins = User.objects.filter(role='head_admin')
            
            for head_admin in head_admins:
                # Create notification data
                notification_data = {
                    'id': f'admin-plan-{admin_user.id}-{int(time.time())}',
                    'type': 'admin_plan_selection',
                    'title': 'Yangi Admin Tarif Tanladi',
                    'message': f"Admin {admin_user.name} ({admin_user.email}) {plan_type} tarifini tanladi. Tasdiqlash kerak.",
                    'adminId': admin_user.id,
                    'adminName': admin_user.name,
                    'adminEmail': admin_user.email,
                    'planType': plan_type,
                    'organization': admin_user.organization or 'Noma\'lum',
                    'createdAt': timezone.now().isoformat(),
                    'isRead': False
                }
                
                # In a real application, you would save this to database
                # For now, we'll log it and could potentially use WebSocket or other real-time notification system
                print(f"Notification sent to head admin {head_admin.name}: {notification_data['message']}")
                
                # TODO: In production, you would:
                # 1. Save notification to database
                # 2. Send real-time notification via WebSocket
                # 3. Send email notification if needed
                
        except Exception as e:
            print(f"Error sending admin plan notification: {e}")
            # Don't fail the main operation if notification fails



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

    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def delete_profile_data(self, request, pk=None):
        """Delete profile picture and status for a specific student"""
        user = self.get_object()
        
        # Check if the request contains the expected data
        delete_profile_photo = request.data.get('delete_profile_photo', False)
        delete_profile_status = request.data.get('delete_profile_status', False)
        
        if not (delete_profile_photo or delete_profile_status):
            return Response({'error': 'At least one deletion flag must be true'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete profile picture if requested
        if delete_profile_photo:
            if user.profile_photo:
                # Delete the file from filesystem
                import os
                from django.conf import settings
                if user.profile_photo.path and os.path.exists(user.profile_photo.path):
                    try:
                        os.remove(user.profile_photo.path)
                    except Exception as e:
                        print(f"Error deleting profile photo file: {e}")
                user.profile_photo = None
                user.profile_photo_url = None
        
        # Delete profile status if requested
        if delete_profile_status:
            user.profile_status = None
        
        user.save()
        
        serializer = UserSerializer(user)
        return Response({
            'user': serializer.data,
            'message': 'Profile data deleted successfully',
            'deleted': {
                'profile_photo': delete_profile_photo,
                'profile_status': delete_profile_status
            }
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

        # Apply admin isolation
        if self.request.user.is_authenticated and self.request.user.role in ['admin', 'head_admin']:
            if self.request.user.role == 'head_admin':
                # Head admin can see all tests
                pass
            else:
                # Regular admin can only see tests created by users they created
                queryset = queryset.filter(
                    models.Q(teacher__created_by_admin=self.request.user) |
                    models.Q(teacher=self.request.user)  # Can see their own tests
                )

        # Apply student isolation - students can only see tests from teachers created by their admin
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            if self.request.user.created_by_admin:
                # Student can only see tests from teachers created by their admin
                queryset = queryset.filter(
                    models.Q(teacher__created_by_admin=self.request.user.created_by_admin) |
                    models.Q(teacher=self.request.user.created_by_admin)  # Admin's own tests
                )
            else:
                # If student has no admin, don't show any tests
                queryset = queryset.none()

        subject = self.request.query_params.get('subject', None)
        teacher = self.request.query_params.get('teacher', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        if teacher:
            queryset = queryset.filter(teacher=teacher)  # Fixed: use teacher instead of teacher_id

        # Filter tests for students based on their class_group (additional filtering)
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
        test = serializer.validated_data['test']

        # Check if student can access this test (same admin isolation)
        if self.request.user.created_by_admin and test.teacher.created_by_admin != self.request.user.created_by_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Siz faqat o'z adminingizning testlarida qatnasha olasiz")

        serializer.save(student=self.request.user)

    def get_queryset(self):
        queryset = TestAttempt.objects.all()

        # Apply admin isolation - regular admins can only see attempts from their students
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            queryset = queryset.filter(
                models.Q(student__created_by_admin=self.request.user) |
                models.Q(test__teacher__created_by_admin=self.request.user) |
                models.Q(test__teacher=self.request.user)  # Can see attempts on their own tests
            )
        
        # Apply student isolation - students can only see their own attempts
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            queryset = queryset.filter(student=self.request.user)

        # Apply teacher isolation - teachers can only see attempts from their students
        elif self.request.user.is_authenticated and self.request.user.role == 'teacher':
            if self.request.user.created_by_admin:
                queryset = queryset.filter(
                    models.Q(student__created_by_admin=self.request.user.created_by_admin) |
                    models.Q(test__teacher=self.request.user)  # Teacher can see attempts on their tests
                )
            else:
                queryset = queryset.filter(test__teacher=self.request.user)

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

    def get_queryset(self):
        queryset = Feedback.objects.all()

        # Apply admin isolation - regular admins can only see feedback from their students
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            queryset = queryset.filter(
                models.Q(attempt__student__created_by_admin=self.request.user) |
                models.Q(attempt__test__teacher__created_by_admin=self.request.user) |
                models.Q(attempt__test__teacher=self.request.user)  # Can see feedback on their own tests
            )
        
        # Apply teacher isolation - teachers can only see feedback from their students
        elif self.request.user.is_authenticated and self.request.user.role == 'teacher':
            if self.request.user.created_by_admin:
                queryset = queryset.filter(
                    models.Q(attempt__student__created_by_admin=self.request.user.created_by_admin) |
                    models.Q(attempt__test__teacher=self.request.user)  # Teacher can see feedback on their tests
                )
            else:
                queryset = queryset.filter(attempt__test__teacher=self.request.user)
        
        # Students can only see their own feedback
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            queryset = queryset.filter(attempt__student=self.request.user)

        return queryset

class TestSessionViewSet(viewsets.ModelViewSet):
    queryset = TestSession.objects.all()
    serializer_class = TestSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TestSession.objects.all()

        # Apply admin isolation - regular admins can only see sessions from their students
        if self.request.user.is_authenticated and self.request.user.role == 'admin':
            queryset = queryset.filter(
                models.Q(student__created_by_admin=self.request.user) |
                models.Q(test__teacher__created_by_admin=self.request.user) |
                models.Q(test__teacher=self.request.user)  # Can see sessions on their own tests
            )
        
        # Apply student isolation - students can only see their own sessions
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            queryset = queryset.filter(student=self.request.user)

        # Apply teacher isolation - teachers can only see sessions from their students
        elif self.request.user.is_authenticated and self.request.user.role == 'teacher':
            if self.request.user.created_by_admin:
                queryset = queryset.filter(
                    models.Q(student__created_by_admin=self.request.user.created_by_admin) |
                    models.Q(test__teacher=self.request.user)  # Teacher can see sessions on their tests
                )
            else:
                queryset = queryset.filter(test__teacher=self.request.user)

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

        # Check if student can access this test (same admin isolation)
        if request.user.created_by_admin and test.teacher.created_by_admin != request.user.created_by_admin:
            return Response({'error': 'Siz faqat o\'z adminingizning testlarida qatnasha olasiz'}, status=status.HTTP_403_FORBIDDEN)

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
            try:
                attempt = TestAttempt.objects.create(
                    student=session.student,
                    test=session.test,
                    answers=session.answers,
                    score=score,
                    time_taken=time_taken
                )
            except Exception as e:
                # Handle unique constraint violation (student already has an attempt for this test)
                if 'UNIQUE constraint failed' in str(e) or 'duplicate key value' in str(e):
                    return Response({
                        'error': 'Test has already been completed by this student',
                        'code': 'DUPLICATE_ATTEMPT'
                    }, status=status.HTTP_409_CONFLICT)
                else:
                    raise e

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

class PricingViewSet(viewsets.ModelViewSet):
    queryset = Pricing.objects.all()
    serializer_class = PricingSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only allow admin and seller to manage pricing"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        # Allow public access for list and retrieve
        return [AllowAny()]

    def get_queryset(self):
        """Only return active pricing plans for non-admin users"""
        if self.request.user.is_authenticated and self.request.user.role in ['admin', 'seller', 'head_admin']:
            return Pricing.objects.all()
        # For unauthenticated users, only return active pricing plans
        return Pricing.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage pricing")
        return serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage pricing")
        return serializer.save()

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
        # Allow public access for list and retrieve
        return [AllowAny()]

    def get_queryset(self):
        """Only return active star packages for non-admin users"""
        if self.request.user.is_authenticated and self.request.user.role in ['admin', 'seller', 'head_admin']:
            return StarPackage.objects.all()
        # For unauthenticated users, only return active star packages
        return StarPackage.objects.filter(is_active=True)

    def perform_create(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage star packages")
        return serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role not in ['admin', 'seller']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only admin and seller can manage star packages")
        return serializer.save()

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

class ContactMessageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing contact messages"""
    queryset = ContactMessage.objects.all()
    permission_classes = [AllowAny]  # Allow public submission
    
    def get_serializer_class(self):
        from .serializers import ContactMessageSerializer
        return ContactMessageSerializer
    
    def create(self, request, *args, **kwargs):
        """Handle contact form submission"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'message': 'Xabaringiz muvaffaqiyatli yuborildi! Biz tez orada javob beramiz.',
            'data': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def admin_list(self, request):
        """List messages for admin users (head admin only)"""
        if request.user.role != 'head_admin':
            return Response({'error': 'Faqat super admin xabarlarni ko\'ra oladi'}, status=status.HTTP_403_FORBIDDEN)
        
        queryset = self.get_queryset()
        
        # Filter by status if provided
        status = request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by subject if provided
        subject = request.query_params.get('subject', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        
        # Search by name, email, or message content
        search = request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(name__icontains=search) |
                models.Q(email__icontains=search) |
                models.Q(message__icontains=search)
            )
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_status(self, request, pk=None):
        """Update message status (head admin only)"""
        if request.user.role != 'head_admin':
            return Response({'error': 'Faqat super admin statusni o\'zgartira oladi'}, status=status.HTTP_403_FORBIDDEN)
        
        message = self.get_object()
        new_status = request.data.get('status')
        admin_reply = request.data.get('admin_reply', '')
        
        if new_status not in ['new', 'read', 'replied', 'closed']:
            return Response({'error': 'Noto\'g\'ri status'}, status=status.HTTP_400_BAD_REQUEST)
        
        message.status = new_status
        if admin_reply:
            message.admin_reply = admin_reply
            message.replied_by = request.user
            from django.utils import timezone
            message.replied_at = timezone.now()
        
        message.save()
        
        serializer = self.get_serializer(message)
        return Response({
            'message': 'Xabar holati yangilandi',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reply(self, request, pk=None):
        """Reply to a contact message (head admin only)"""
        if request.user.role != 'head_admin':
            return Response({'error': 'Faqat super admin javob bera oladi'}, status=status.HTTP_403_FORBIDDEN)
        
        message = self.get_object()
        admin_reply = request.data.get('admin_reply', '')
        
        if not admin_reply:
            return Response({'error': 'Javob matni kerak'}, status=status.HTTP_400_BAD_REQUEST)
        
        message.admin_reply = admin_reply
        message.replied_by = request.user
        message.status = 'replied'
        from django.utils import timezone
        message.replied_at = timezone.now()
        message.save()
        
        # Send email notification to user
        email_sent = self._send_reply_email(message, admin_reply)
        
        serializer = self.get_serializer(message)
        return Response({
            'message': 'Javob yuborildi' + (' va email yuborildi' if email_sent else ''),
            'email_sent': email_sent,
            'data': serializer.data
        })
    
    def _send_reply_email(self, message, admin_reply):
        """Send email notification to user when admin replies"""
        try:
            # Import Django email functionality
            from django.core.mail import send_mail
            from django.template.loader import render_to_string
            from django.utils.html import strip_tags
            from django.conf import settings
            
            # Prepare email content
            subject = f'Reply to your message: {message.get_subject_display()}'
            
            # Create HTML email content
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #135bec; margin-bottom: 20px;">Javob xabaringiz bor!</h2>
                    
                    <p>Assalomu alaykum <strong>{message.name}</strong>,</p>
                    
                    <p>Sizning "<strong>{message.get_subject_display()}</strong>" mavzusidagi xabaringizga javob berildi:</p>
                    
                    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #135bec; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #374151;">Sizning xabaringiz:</h4>
                        <p style="margin: 0; color: #6b7280;">{message.message}</p>
                    </div>
                    
                    <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
                        <h4 style="margin: 0 0 10px 0; color: #0369a1;">Admin javobi:</h4>
                        <p style="margin: 0; color: #0c4a6e;">{admin_reply}</p>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; font-size: 14px; margin: 0;">
                            Javob bergan: {message.replied_by.name if message.replied_by else 'Admin'}<br>
                            Sana: {message.replied_at.strftime('%Y-%m-%d %H:%M') if message.replied_at else ''}
                        </p>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 8px; text-align: center;">
                        <p style="margin: 0; color: #0369a1; font-weight: 600;">Examify - Sergeli ixtisoslashtirilgan maktab</p>
                        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">Professional ta'lim platformasi</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            # Create plain text version
            plain_message = f"""
Javob xabaringiz bor!

Assalomu alaykum {message.name},

Sizning "{message.get_subject_display()}" mavzusidagi xabaringizga javob berildi:

Sizning xabaringiz:
{message.message}

Admin javobi:
{admin_reply}

Javob bergan: {message.replied_by.name if message.replied_by else 'Admin'}
Sana: {message.replied_at.strftime('%Y-%m-%d %H:%M') if message.replied_at else ''}

Examify - Sergeli ixtisoslashtirilgan maktab
Professional ta'lim platformasi
            """
            
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL or 'noreply@examify.uz',
                recipient_list=[message.email],
                html_message=html_content,
                fail_silently=False
            )
            
            print(f"Email sent successfully to {message.email}")
            return True
            
        except Exception as e:
            print(f"Failed to send email: {e}")
            # Don't fail the main operation if email fails
            return False
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_messages(self, request):
        """Get user's own contact messages"""
        if not request.user.email:
            return Response({'error': 'Email manzili kerak'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get messages by email (since users don't need to be logged in to send messages)
        queryset = ContactMessage.objects.filter(email=request.user.email).order_by('-created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['put'], permission_classes=[IsAuthenticated])
    def edit_message(self, request, pk=None):
        """Edit user's own contact message (only if not replied yet)"""
        if not request.user.email:
            return Response({'error': 'Email manzili kerak'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message = ContactMessage.objects.get(id=pk, email=request.user.email)
        except ContactMessage.DoesNotExist:
            return Response({'error': 'Xabar topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if message has already been replied to
        if message.status == 'replied':
            return Response({'error': 'Javob berilgan xabarni tahrirlab bo\'lmaydi'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Only allow editing name, phone, subject, and message (not email)
        name = request.data.get('name')
        phone = request.data.get('phone')
        subject = request.data.get('subject')
        message_text = request.data.get('message')
        
        if name:
            message.name = name
        if phone is not None:
            message.phone = phone
        if subject:
            message.subject = subject
        if message_text:
            message.message = message_text
        
        message.save()
        
        serializer = self.get_serializer(message)
        return Response({
            'message': 'Xabar muvaffaqiyatli yangilandi',
            'data': serializer.data
        })
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def delete_message(self, request, pk=None):
        """Delete user's own contact message (only if not replied yet)"""
        if not request.user.email:
            return Response({'error': 'Email manzili kerak'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            message = ContactMessage.objects.get(id=pk, email=request.user.email)
        except ContactMessage.DoesNotExist:
            return Response({'error': 'Xabar topilmadi'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if message has already been replied to
        if message.status == 'replied':
            return Response({'error': 'Javob berilgan xabarni o\'chirib bo\'lmaydi'}, status=status.HTTP_400_BAD_REQUEST)
        
        message.delete()
        
        return Response({'message': 'Xabar muvaffaqiyatli o\'chirildi'})


