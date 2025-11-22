from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from .models import User, Test, Question, TestAttempt, Feedback, TestSession, WarningLog
from .serializers import UserSerializer, TestSerializer, QuestionSerializer, TestAttemptSerializer, FeedbackSerializer, TestSessionSerializer, WarningLogSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Password is already hashed in the serializer's create method
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def login(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username is an ID (for students/teachers) or email (for admin)
        user = None
        if '@' in username:
            # Email login (for admin)
            user = authenticate(username=username, password=password)
        else:
            # ID login (for students/teachers)
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
    def ban_user(self, request, pk=None):
        """Ban a user (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Only admin can ban users'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.is_banned = True
        user.ban_reason = request.data.get('reason', 'Admin tomonidan bloklandi')
        user.ban_date = timezone.now()

        # Generate unban code
        import random
        user.unban_code = str(random.randint(1000, 9999))
        user.save()

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def unban_user(self, request, pk=None):
        """Unban a user (admin only)"""
        if request.user.role != 'admin':
            return Response({'error': 'Only admin can unban users'}, status=status.HTTP_403_FORBIDDEN)

        user = self.get_object()
        user.is_banned = False
        user.ban_reason = ''
        user.ban_date = None
        user.unban_code = ''
        user.save()

        serializer = self.get_serializer(user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def unban_with_code(self, request):
        """Unban user with unban code"""
        code = request.data.get('code')
        if not code:
            return Response({'error': 'Code is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(unban_code=code, is_banned=True)
            user.is_banned = False
            user.ban_reason = ''
            user.ban_date = None
            user.unban_code = ''
            user.save()

            serializer = UserSerializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response({'error': 'Invalid unban code'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def ban_current_user(self, request):
        """Ban the current user (for anti-cheating violations)"""
        user = request.user
        user.is_banned = True
        user.ban_reason = request.data.get('reason', 'Test qoidalariga rioya qilmaganligi uchun bloklandi')
        user.ban_date = timezone.now()

        # Generate unban code
        import random
        user.unban_code = str(random.randint(1000, 9999))
        user.save()

        serializer = UserSerializer(user)
        return Response(serializer.data)

class TestViewSet(viewsets.ModelViewSet):
    queryset = Test.objects.all()
    serializer_class = TestSerializer
    permission_classes = [IsAuthenticated]

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
            # For students, show tests that are available to all classes or match their grade
            class_group = self.request.user.class_group
            if class_group:
                # Show tests with empty target_grades (all classes) or specific class
                from django.db.models import Q
                main_grade = class_group.split('-')[0] if '-' in class_group else class_group
                
                # For now, show all active tests to students to ensure newly created tests are visible
                # TODO: Implement proper JSON field filtering when we upgrade to PostgreSQL
                queryset = queryset.filter(is_active=True)
            else:
                # If no class_group, show only tests available to all classes
                queryset = queryset.filter(target_grades=[])
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
            
            if session.is_expired or session.time_remaining <= 0:
                session.mark_expired()
                return Response({'error': 'Test session has expired'}, status=status.HTTP_410_GONE)
            
            # Calculate score
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
            
            return Response({
                'success': True,
                'score': score,
                'attempt_id': attempt.id,
                'message': 'Test completed successfully'
            })
            
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

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

class WarningLogViewSet(viewsets.ModelViewSet):
    queryset = WarningLog.objects.all()
    serializer_class = WarningLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = WarningLog.objects.all()
        session = self.request.query_params.get('session', None)
        student = self.request.query_params.get('student', None)

        if session:
            queryset = queryset.filter(session_id=session)
        if student:
            queryset = queryset.filter(student_id=student)

        return queryset

    @action(detail=False, methods=['post'])
    def log_warning(self, request):
        """Log a warning for a test session"""
        session_id = request.data.get('session_id')
        warning_type = request.data.get('warning_type')
        warning_message = request.data.get('warning_message')

        if not all([session_id, warning_type, warning_message]):
            return Response({'error': 'session_id, warning_type, and warning_message are required'},
                          status=status.HTTP_400_BAD_REQUEST)

        try:
            session = TestSession.objects.get(session_id=session_id, student=request.user)

            # Create warning log
            warning = WarningLog.objects.create(
                session=session,
                student=request.user,
                warning_type=warning_type,
                warning_message=warning_message
            )

            # Increment warning count in session
            session.warning_count += 1
            session.save()

            # Check if student should see unban prompt (3 warnings per session)
            if session.warning_count >= 3 and not session.unban_prompt_shown:
                # Set unban prompt shown flag
                session.unban_prompt_shown = True
                session.save()

                return Response({
                    'warning_logged': True,
                    'unban_prompt_triggered': True,
                    'warning_count': session.warning_count
                })

            serializer = WarningLogSerializer(warning)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
