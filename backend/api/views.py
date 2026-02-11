import time
from rest_framework import viewsets, status
from rest_framework.decorators import action, authentication_classes, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.db import models
from .models import User, Test, Question, TestAttempt, Feedback, TestSession, Pricing, StarPackage, ContactMessage, SiteUpdate, SiteSettings, PremiumPurchase
from .serializers import UserSerializer, TestSerializer, QuestionSerializer, TestAttemptSerializer, FeedbackSerializer, TestSessionSerializer, PricingSerializer, StarPackageSerializer, ContactMessageSerializer, SiteUpdateSerializer, SiteSettingsSerializer, PremiumPurchaseSerializer

class SiteSettingsViewSet(viewsets.ViewSet):
    def initialize_request(self, request, *args, **kwargs):
        if hasattr(self, 'action_map'):
            self.action = self.action_map.get(request.method.lower())
        return super().initialize_request(request, *args, **kwargs)

    def get_permissions(self):
        if self.action == 'update_settings':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get_authenticators(self):
        if self.action == 'update_settings':
            from rest_framework_simplejwt.authentication import JWTAuthentication
            return [JWTAuthentication()]
        return []


    def list(self, request):
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_settings(self, request):
        if request.user.role != 'head_admin':
            return Response({'error': 'Only head admin can update site settings'}, status=status.HTTP_403_FORBIDDEN)
        
        settings = SiteSettings.get_settings()
        serializer = SiteSettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def initialize_request(self, request, *args, **kwargs):
        if hasattr(self, 'action_map'):
            self.action = self.action_map.get(request.method.lower())
        return super().initialize_request(request, *args, **kwargs)

    def get_authenticators(self):
        if self.action:
            action_func = getattr(self, self.action, None)
            if action_func and hasattr(action_func, 'authentication_classes'):
                return [auth() for auth in action_func.authentication_classes]
        return super().get_authenticators()

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

        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)

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

    @action(detail=False, methods=['post'], authentication_classes=[], permission_classes=[AllowAny])
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

    @action(detail=False, methods=['post'], authentication_classes=[], permission_classes=[AllowAny])
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

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def purchase_premium_with_stars(self, request):
        """Student purchases premium using their stars"""
        user = request.user
        
        if user.role != 'student':
            return Response({'error': 'Faqat o\'quvchilar premium sotib olishi mumkin'}, status=status.HTTP_400_BAD_REQUEST)
        
        plan_type = request.data.get('plan_type')
        if plan_type not in ['week', 'month', 'year']:
            return Response({'error': 'Noto\'g\'ri tarif rejasi'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Define star prices for each plan
        star_prices = {
            'week': 300,
            'month': 1200,
            'year': 8000
        }
        
        stars_needed = star_prices.get(plan_type, 0)
        if user.stars < stars_needed:
            return Response({
                'error': 'Yulduzlaringiz yetarli emas',
                'stars_needed': stars_needed,
                'stars_current': user.stars
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate expiry date
        now = timezone.now()
        if plan_type == 'week':
            expiry_date = now + timezone.timedelta(weeks=1)
        elif plan_type == 'month':
            expiry_date = now + timezone.timedelta(days=30)
        elif plan_type == 'year':
            expiry_date = now + timezone.timedelta(days=365)
        
        # Calculate the money equivalent for tracking (using pricing table)
        try:
            pricing = Pricing.objects.get(plan_type=plan_type, is_active=True)
            money_value = float(pricing.discounted_price)
        except Pricing.DoesNotExist:
            money_value = 0
        
        # Deduct stars and grant premium
        user.stars -= stars_needed
        
        # Extend premium if already premium
        if user.is_premium and user.premium_type == 'time_based' and user.premium_expiry_date and user.premium_expiry_date > now:
            # Extend existing premium
            from datetime import timedelta
            base_date = user.premium_expiry_date
            if plan_type == 'week':
                user.premium_expiry_date = base_date + timedelta(weeks=1)
            elif plan_type == 'month':
                user.premium_expiry_date = base_date + timedelta(days=30)
            elif plan_type == 'year':
                user.premium_expiry_date = base_date + timedelta(days=365)
        else:
            # Grant new premium
            user.is_premium = True
            user.premium_type = 'time_based'
            user.premium_granted_date = now
            user.premium_expiry_date = expiry_date
            user.premium_plan = plan_type
            user.premium_cost = money_value
            user.premium_emoji_count = 50
        
        user.save()
        
        # Create purchase record
        purchase = PremiumPurchase.objects.create(
            student=user,
            purchase_type='stars',
            plan_type=plan_type,
            stars_used=stars_needed,
            money_spent=money_value,
            granted_date=now,
            expiry_date=user.premium_expiry_date
        )
        
        serializer = UserSerializer(user)
        return Response({
            'user': serializer.data,
            'message': 'Premium muvaffaqiyatli sotib olindi',
            'purchase': {
                'id': purchase.id,
                'plan_type': plan_type,
                'stars_used': stars_needed,
                'granted_date': now,
                'expiry_date': user.premium_expiry_date
            }
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

    def initialize_request(self, request, *args, **kwargs):
        if hasattr(self, 'action_map'):
            self.action = self.action_map.get(request.method.lower())
        return super().initialize_request(request, *args, **kwargs)

    def get_authenticators(self):
        if self.action:
            action_func = getattr(self, self.action, None)
            if action_func and hasattr(action_func, 'authentication_classes'):
                return [auth() for auth in action_func.authentication_classes]
        return super().get_authenticators()

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[AllowAny])
    def public_list(self, request):
        """Public endpoint to get all tests (for questions page)"""
        queryset = Test.objects.filter(is_active=True)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[AllowAny])
    def public_stats(self, request):
        """Public endpoint to get landing page statistics"""
        return Response({
            'tests_count': Test.objects.count(),
            'students_count': User.objects.filter(role='student').count(),
            'teachers_count': User.objects.filter(role='teacher').count(),
            'attempts_count': TestAttempt.objects.count()
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def purchase(self, request, pk=None):
        """Allow a student to purchase a test using stars"""
        test = self.get_object()
        user = request.user

        if user.role != 'student':
            return Response({'error': 'Faqat o\'quvchilar test sotib olishi mumkin'}, status=status.HTTP_400_BAD_REQUEST)

        if test.star_price <= 0:
            return Response({'error': 'Ushbu test tekin'}, status=status.HTTP_400_BAD_REQUEST)

        owned_tests = user.owned_tests or []
        # Check if already owned (handles both int and str IDs)
        if test.id in owned_tests or str(test.id) in [str(tid) for tid in owned_tests]:
            return Response({'error': 'Siz ushbu testni allaqachon sotib olgansiz'}, status=status.HTTP_400_BAD_REQUEST)

        if user.stars < test.star_price:
            return Response({'error': 'Yulduzlaringiz yetarli emas'}, status=status.HTTP_400_BAD_REQUEST)

        # Process purchase
        user.stars -= test.star_price
        if not owned_tests:
            owned_tests = []
        owned_tests.append(test.id)
        user.owned_tests = owned_tests
        user.save()

        return Response({
            'message': 'Test muvaffaqiyatli sotib olindi',
            'stars': user.stars,
            'owned_tests': user.owned_tests
        })

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)

    def perform_update(self, serializer):
        serializer.save()

    def get_queryset(self):
        from django.db.models import Count, Avg
        queryset = Test.objects.select_related('teacher').annotate(
            question_count_ann=Count('questions', distinct=True),
            attempt_count_ann=Count('attempts', distinct=True),
            average_score_ann=Avg('attempts__score'),
            average_time_ann=Avg('attempts__time_taken')
        )

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

        # Apply student isolation - students can only see tests from teachers created by their admin OR global tests
        elif self.request.user.is_authenticated and self.request.user.role == 'student':
            # Base query for global tests
            global_tests_query = models.Q(teacher__role='content_manager')
            
            if self.request.user.created_by_admin:
                # Student can see tests from teachers created by their admin AND global tests
                queryset = queryset.filter(
                    models.Q(teacher__created_by_admin=self.request.user.created_by_admin) |
                    models.Q(teacher=self.request.user.created_by_admin) |  # Admin's own tests
                    global_tests_query
                )
            else:
                # If student has no admin, only show global tests
                queryset = queryset.filter(global_tests_query)

        subject = self.request.query_params.get('subject', None)
        teacher = self.request.query_params.get('teacher', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        # Apply teacher/content_manager isolation - only see their own tests
        elif self.request.user.is_authenticated and self.request.user.role in ['teacher', 'content_manager']:
            queryset = queryset.filter(teacher=self.request.user)

        subject = self.request.query_params.get('subject', None)
        teacher = self.request.query_params.get('teacher', None)
        if subject:
            queryset = queryset.filter(subject=subject)
        if teacher:
            queryset = queryset.filter(teacher=teacher)  # Fixed: use teacher instead of teacher_id

        # Filter tests for students based on their class_group (additional filtering)
        if self.request.user.is_authenticated and self.request.user.role == 'student':
            # Base filter: must be active
            queryset = queryset.filter(is_active=True)
            
            # For students, only show tests that are specifically assigned to their class OR global tests
            class_group = self.request.user.class_group
            if class_group:
                # Extract grade from class_group (e.g., "9-01" -> "9")
                student_grade = class_group.split('-')[0] if '-' in class_group else class_group

                # Only show tests where the student's grade matches OR is for content_manager
                queryset = queryset.filter(
                    models.Q(target_grades__icontains=student_grade) |  # Grade in target_grades string
                    models.Q(target_grades='') |                        # Empty means all grades
                    models.Q(teacher__role='content_manager')           # Global tests are always allowed
                )
            else:
                # If no class_group, ONLY show global tests
                queryset = queryset.filter(teacher__role='content_manager')
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

    def initialize_request(self, request, *args, **kwargs):
        if hasattr(self, 'action_map'):
            self.action = self.action_map.get(request.method.lower())
        return super().initialize_request(request, *args, **kwargs)

    def get_authenticators(self):
        if self.action:
            action_func = getattr(self, self.action, None)
            if action_func and hasattr(action_func, 'authentication_classes'):
                return [auth() for auth in action_func.authentication_classes]
        return super().get_authenticators()

    def get_queryset(self):
        queryset = Question.objects.all()
        test_id = self.request.query_params.get('test', None)
        if test_id:
            queryset = queryset.filter(test_id=test_id)
        return queryset

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[AllowAny])
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

        # Check if student can access this test (admin isolation OR global test)
        if self.request.user.role == 'student':
            is_global_test = test.teacher.role == 'content_manager'
            
            if self.request.user.created_by_admin:
                # Student with admin can see tests from their admin's teachers OR global tests
                can_access = (
                    test.teacher.created_by_admin == self.request.user.created_by_admin or
                    test.teacher == self.request.user.created_by_admin or
                    is_global_test
                )
            else:
                # Student without admin can only see global tests
                can_access = is_global_test
                
            if not can_access:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Siz ushbu testda qatnasha olmaysiz")

        # Check premium and star access
        if test.is_premium and not self.request.user.is_premium:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Ushbu test faqat Premium foydalanuvchilar uchun")
        
        if test.star_price > 0:
            owned_tests = self.request.user.owned_tests or []
            # Check if test.id is in owned_tests (handle both int and str types)
            if test.id not in owned_tests and str(test.id) not in [str(tid) for tid in owned_tests]:
                 from rest_framework.exceptions import PermissionDenied
                 raise PermissionDenied("Ushbu testni qatnashish uchun uni yulduzlar bilan sotib olishingiz kerak")

        attempt = serializer.save(student=self.request.user)
        self.request.user.update_student_stats()
        return attempt

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

        # Check if student can access this test (admin isolation OR global test)
        if request.user.role == 'student':
            is_global_test = test.teacher.role == 'content_manager'
            
            if request.user.created_by_admin:
                # Student with admin can see tests from their admin's teachers OR global tests
                can_access = (
                    test.teacher.created_by_admin == request.user.created_by_admin or
                    test.teacher == request.user.created_by_admin or
                    is_global_test
                )
            else:
                # Student without admin can only see global tests
                can_access = is_global_test
                
            if not can_access:
                return Response({'error': 'Siz ushbu testda qatnasha olmaysiz'}, status=status.HTTP_403_FORBIDDEN)

            # Check premium and star access
            if test.is_premium and not request.user.is_premium:
                return Response({'error': 'Ushbu test faqat Premium foydalanuvchilar uchun'}, status=status.HTTP_403_FORBIDDEN)
            
            if test.star_price > 0:
                owned_tests = request.user.owned_tests or []
                # Check if test.id is in owned_tests (handle both int and str types)
                if test.id not in owned_tests and str(test.id) not in [str(tid) for tid in owned_tests]:
                    return Response({
                        'error': 'star_purchase_required',
                        'message': 'Ushbu testni qatnashish uchun uni yulduzlar bilan sotib olishingiz kerak',
                        'star_price': test.star_price
                    }, status=status.HTTP_403_FORBIDDEN)

        # Check if student already has an attempt for this test
        existing_attempt = TestAttempt.objects.filter(student=request.user, test=test).first()
        if existing_attempt:
            return Response({'error': 'Test already completed'}, status=status.HTTP_400_BAD_REQUEST)

        # Check daily test limit
        if request.user.role == 'student':
            if not request.user.can_take_test():
                daily_limit = request.user.get_daily_limit()
                return Response({
                    'error': 'daily_limit_reached',
                    'message': f'Kunlik test limiti tugadi. Sizning kunlik limitingiz: {daily_limit} ta test.',
                    'daily_limit': daily_limit,
                    'daily_tests_taken': request.user.daily_tests_taken,
                    'is_premium': request.user.is_premium
                }, status=status.HTTP_403_FORBIDDEN)

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
        now = timezone.now()
        expires_at = now + timezone.timedelta(minutes=test.time_limit)
        
        # Generate unique session ID
        import uuid
        session_id = str(uuid.uuid4())
        
        session = TestSession.objects.create(
            session_id=session_id,
            test=test,
            student=request.user,
            started_at=now,
            expires_at=expires_at,
            is_completed=False,
            is_expired=False
        )
        
        # Increment daily tests counter for students
        if request.user.role == 'student':
            request.user.increment_daily_tests()
        
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def get_session(self, request):
        """Get session by ID"""
        session_id = request.query_params.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            session = TestSession.objects.get(session_id=session_id)
            
            # Check permissions
            if request.user.role == 'student' and session.student != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
                
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['put'])
    def update_answers(self, request):
        """Update answers for a session"""
        session_id = request.data.get('session_id')
        answers = request.data.get('answers')
        
        if not session_id or answers is None:
            return Response({'error': 'session_id and answers are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            session = TestSession.objects.get(session_id=session_id)
            
            # Check permissions
            if session.student != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
                
            # Check if session is active
            if not session.is_active:
                return Response({'error': 'Session is expired or completed'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Update answers
            current_answers = session.answers or {}
            if isinstance(answers, dict):
                current_answers.update(answers)
            else:
                current_answers = answers
                
            session.answers = current_answers
            session.save()
            
            return Response({'status': 'success'})
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def complete_session(self, request):
        """Complete a session and grade it with retry logic for database locks"""
        from django.db import close_old_connections, DatabaseError
        from django.db import transaction
        import time
        
        # Close old connections before starting
        close_old_connections()
        
        max_retries = 3
        retry_delay = 0.5  # Start with 0.5 seconds
        
        for attempt in range(max_retries):
            try:
                with transaction.atomic():
                    return self._perform_complete(request)
            except DatabaseError as e:
                if 'database is locked' in str(e) and attempt < max_retries - 1:
                    close_old_connections()
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                    continue
                raise
            finally:
                # Close connections after operation
                close_old_connections()

    def _perform_complete(self, request):
        session_id = request.data.get('session_id')
        
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            # Use select_for_update to handle concurrent access properly
            session = TestSession.objects.select_for_update().get(session_id=session_id)
            
            # Check permissions
            if session.student != request.user:
                return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
                
            if session.is_completed:
                return Response({'error': 'Session already completed'}, status=status.HTTP_400_BAD_REQUEST)
                
            # Mark session as completed (outside atomic save)
            session.is_completed = True
            from django.utils import timezone
            session.completed_at = timezone.now()
            session.save(update_fields=['is_completed', 'completed_at'])
            
            # Create TestAttempt outside the session lock
            test = session.test
            answers = session.answers
            
            # Calculate score
            correct_count = 0
            total_score = 0
            student_answers = {}
            
            questions = list(test.questions.all())
            total_questions = len(questions)
            
            for question in questions:
                # Get student answer for this question
                # The format is typically { "question_id": "answer" }
                question_id_str = str(question.id)
                student_answer = answers.get(question_id_str)
                
                if student_answer:
                    # Clean and normalize answer
                    normalized_student = str(student_answer).strip().lower()
                    normalized_correct = str(question.correct_answer).strip().lower()
                    
                    if normalized_student == normalized_correct:
                        correct_count += 1
                        # For now assume 1 point per question, can be improved later
                        
                    student_answers[question_id_str] = student_answer
            
            score_percentage = (correct_count / total_questions * 100) if total_questions > 0 else 0
            
            # Calculate time taken
            from django.utils import timezone
            time_taken = int((session.completed_at - session.started_at).total_seconds() / 60)
            
            # Create or update attempt
            attempt, created = TestAttempt.objects.update_or_create(
                student=request.user,
                test=test,
                defaults={
                    'answers': student_answers,
                    'score': score_percentage,
                    'submitted_at': timezone.now(),
                    'time_taken': time_taken
                }
            )

            # Update student stats and grant stars
            student = request.user
            attempts = TestAttempt.objects.filter(student=student)
            total_attempts = attempts.count()
            avg_score = sum(a.score for a in attempts) / total_attempts if total_attempts > 0 else 0
            
            student.total_tests_taken = total_attempts
            student.average_score = avg_score
            student.stars += 2  # Reward for completing a test

            # Star Refund Logic: If score >= 80% on a star-purchased test, refund stars
            refunded_stars = 0
            if test.star_price > 0 and score_percentage >= 80:
                student.stars += test.star_price
                refunded_stars = test.star_price

            student.save()
            
            message = 'Test muvaffaqiyatli yakunlandi! +2 ⭐ berildi'
            if refunded_stars > 0:
                message += f'. {refunded_stars} star qaytarib berildi!'

            return Response({
                'success': True,
                'message': message,
                'attempt_id': attempt.id,
                'score': score_percentage,
                'stars': student.stars,
                'refunded_stars': refunded_stars
            })
            
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def auto_expire_sessions(self, request):
        """Auto expire sessions that have passed their time limit"""
        # This endpoint should be called by a cron job or scheduled task
        # But can be called manually by admins for maintenance
        if not request.user.is_authenticated or request.user.role not in ['admin', 'head_admin']:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
             
        from django.utils import timezone
        now = timezone.now()
        
        # Find active sessions that have expired
        expired_sessions = TestSession.objects.filter(
            is_completed=False,
            is_expired=False,
            expires_at__lte=now
        )
        
        count = expired_sessions.count()
        
        for session in expired_sessions:
            session.mark_expired()
            
        return Response({'message': f'{count} sessions marked as expired'})


class PricingViewSet(viewsets.ModelViewSet):
    queryset = Pricing.objects.all()
    serializer_class = PricingSerializer
    permission_classes = [AllowAny] # Allow viewing pricing publicly

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()] # Only authenticated users can modify (further restricted in perform_create)
        return [AllowAny()]

    def perform_create(self, serializer):
        if self.request.user.role != 'head_admin':
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Only head admin can manage pricing")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'head_admin':
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Only head admin can manage pricing")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'head_admin':
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Only head admin can manage pricing")
        instance.delete()


class StarPackageViewSet(viewsets.ModelViewSet):
    queryset = StarPackage.objects.all()
    serializer_class = StarPackageSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'head_admin':
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Only head admin can manage star packages")
        serializer.save()

    def perform_update(self, serializer):
        if self.request.user.role != 'head_admin':
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Only head admin can manage star packages")
        serializer.save()

    def perform_destroy(self, instance):
        if self.request.user.role != 'head_admin':
             from rest_framework.exceptions import PermissionDenied
             raise PermissionDenied("Only head admin can manage star packages")
        instance.delete()


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    permission_classes = [AllowAny]

    def get_permissions(self):
        # Anyone can create (submit) a message
        if self.action == 'create':
            return [AllowAny()]
        # Only authenticated users can list/retrieve/update/delete
        return [IsAuthenticated()]

    def get_queryset(self):
        queryset = ContactMessage.objects.all()
        
        # If user is admin/head_admin, they can see messages
        if self.request.user.is_authenticated:
            if self.request.user.role in ['admin', 'head_admin']:
                # Filter by status if provided
                status = self.request.query_params.get('status')
                if status:
                    queryset = queryset.filter(status=status)
                return queryset
            
            # If user is not admin, they can only see their own messages (by email)
            # This handles the case where a logged-in user wants to see their submitted messages
            return queryset.filter(email=self.request.user.email)
            
        # Unauthenticated users can't see list
        return queryset.none()

    @action(detail=False, methods=['get'])
    def admin_list(self, request):
        """Endpoint for admins to list contact messages"""
        if not request.user.is_authenticated or request.user.role not in ['admin', 'head_admin']:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        return self.list(request)
        
    @action(detail=False, methods=['get'])
    def my_messages(self, request):
        """Endpoint for users to see their own messages"""
        if not request.user.is_authenticated:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
        
        queryset = ContactMessage.objects.filter(email=request.user.email)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        """Admin reply to a contact message"""
        if not request.user.is_authenticated or request.user.role not in ['admin', 'head_admin']:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
             
        message = self.get_object()
        reply_text = request.data.get('reply')
        
        if not reply_text:
            return Response({'error': 'Reply text is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        message.admin_reply = reply_text
        message.replied_by = request.user
        message.replied_at = timezone.now()
        message.status = 'replied'
        message.save()
        
        # TODO: Send email with reply
        
        serializer = self.get_serializer(message)
        return Response(serializer.data)
        
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update status of a message"""
        if not request.user.is_authenticated or request.user.role not in ['admin', 'head_admin']:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
             
        message = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status or new_status not in dict(ContactMessage.STATUS_CHOICES):
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
            
        message.status = new_status
        message.save()
        
        serializer = self.get_serializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=['put'])
    def edit_message(self, request, pk=None):
        """Allow users to edit their own NEW messages"""
        if not request.user.is_authenticated:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
             
        # Look up directly to ensure ownership check avoids admin override in get_queryset
        try:
            message = ContactMessage.objects.get(pk=pk)
        except ContactMessage.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
            
        # Check ownership
        if message.email != request.user.email:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
            
        # Check status - can only edit new messages
        if message.status != 'new':
            return Response({'error': 'Cannot edit processed messages'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Update allowed fields
        name = request.data.get('name')
        subject = request.data.get('subject')
        msg_text = request.data.get('message')
        phone = request.data.get('phone')
        
        if name: message.name = name
        if subject: message.subject = subject
        if msg_text: message.message = msg_text
        if phone is not None: message.phone = phone
        
        message.save()
        
        serializer = self.get_serializer(message)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def delete_message(self, request, pk=None):
        """Allow users to delete their own NEW messages"""
        if not request.user.is_authenticated:
             return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
             
        try:
            message = ContactMessage.objects.get(pk=pk)
        except ContactMessage.DoesNotExist:
             return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
             
        if message.email != request.user.email:
             return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
             
        if message.status != 'new':
             return Response({'error': 'Cannot delete processed messages'}, status=status.HTTP_400_BAD_REQUEST)
             
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class SiteUpdateViewSet(viewsets.ModelViewSet):
    queryset = SiteUpdate.objects.all()
    serializer_class = SiteUpdateSerializer
    permission_classes = [AllowAny]

    def initialize_request(self, request, *args, **kwargs):
        if hasattr(self, 'action_map'):
            self.action = self.action_map.get(request.method.lower())
        return super().initialize_request(request, *args, **kwargs)

    def get_authenticators(self):
        if self.action:
            action_func = getattr(self, self.action, None)
            if action_func and hasattr(action_func, 'authentication_classes'):
                return [auth() for auth in action_func.authentication_classes]
        return super().get_authenticators()

    def get_permissions(self):
        # Create/Update/Delete requires admin/head_admin
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]
    
    def create(self, request, *args, **kwargs):
        # Only admins/head_admins can create updates
        if request.user.role not in ['admin', 'head_admin']:
            return Response({'error': 'Only admins can create updates'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['get'], authentication_classes=[], permission_classes=[AllowAny])
    def public_list(self, request):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

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


class PremiumPurchaseViewSet(viewsets.ModelViewSet):
    """ViewSet for managing premium purchases (for seller/admin to track)"""
    queryset = PremiumPurchase.objects.all()
    serializer_class = PremiumPurchaseSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = PremiumPurchase.objects.select_related('student').all()
        
        # Filter by purchase type
        purchase_type = self.request.query_params.get('purchase_type')
        if purchase_type:
            queryset = queryset.filter(purchase_type=purchase_type)
        
        # Filter by student
        student_id = self.request.query_params.get('student_id')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def my_purchases(self, request):
        """Get the current student's own premium purchases"""
        if not request.user.is_authenticated or request.user.role != 'student':
            return Response({'error': 'Only students can view their purchases'}, status=status.HTTP_403_FORBIDDEN)
        
        purchases = PremiumPurchase.objects.filter(student=request.user).order_by('-granted_date')
        serializer = self.get_serializer(purchases, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def seller_stats(self, request):
        """Get premium purchase statistics for sellers"""
        if not request.user.is_authenticated or request.user.role not in ['seller', 'admin', 'head_admin']:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get all premium purchases
        purchases = PremiumPurchase.objects.all()
        
        # Calculate stats
        stars_purchases = purchases.filter(purchase_type='stars')
        money_purchases = purchases.filter(purchase_type='money')
        
        stats = {
            'total_purchases': purchases.count(),
            'stars_purchases_count': stars_purchases.count(),
            'money_purchases_count': money_purchases.count(),
            'total_stars_used': stars_purchases.aggregate(models.Sum('stars_used'))['stars_used__sum'] or 0,
            'total_money_spent': float(money_purchases.aggregate(models.Sum('money_spent'))['money_spent__sum'] or 0),
            'recent_purchases': PremiumPurchaseSerializer(
                purchases.order_by('-granted_date')[:10], 
                many=True
            ).data
        }
        
        return Response(stats)

