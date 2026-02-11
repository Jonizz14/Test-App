from rest_framework import serializers
from .models import User, Test, Question, TestAttempt, Feedback, TestSession, Pricing, StarPackage, ContactMessage, SiteUpdate, SiteSettings, PremiumPurchase

class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    username = serializers.CharField(validators=[], required=False)  # Remove default username validators
    email = serializers.EmailField(validators=[], required=False)  # Remove default email validators
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)

    profile_photo_url = serializers.SerializerMethodField()
    premium_info = serializers.SerializerMethodField()
    daily_limit = serializers.SerializerMethodField()
    daily_tests_remaining = serializers.SerializerMethodField()
    premium_until = serializers.DateTimeField(source='premium_expiry_date', required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'display_id', 'email', 'password', 'role', 'name', 'first_name', 'last_name',
                  'created_at', 'last_login', 'class_group', 'direction', 'registration_date',
                  'seller_earnings', 'subjects', 'bio', 'total_tests_created', 'average_student_score', 'is_curator', 'curator_class',
                  'total_tests_taken', 'average_score', 'completed_subjects', 'stars', 'owned_tests',
                  'is_premium', 'premium_granted_date', 'premium_expiry_date', 'premium_plan', 'premium_cost', 'premium_type', 'premium_balance',
                  'profile_photo', 'profile_photo_url', 'profile_status', 'premium_emoji_count',
                  'background_gradient', 'selected_emojis', 'premium_info', 'premium_until',
                  'hide_premium_from_others', 'hide_premium_from_self',
                  'admin_premium_plan', 'admin_premium_pending', 'admin_premium_approved', 'admin_premium_granted_date', 'admin_premium_expiry_date', 'admin_premium_cost',
                  'organization', 'daily_tests_taken', 'daily_limit', 'daily_tests_remaining']
        read_only_fields = ['id', 'created_at', 'last_login', 'display_id', 'daily_limit', 'daily_tests_remaining']

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            else:
                return obj.profile_photo.url
        return None

    def get_premium_info(self, obj):
        return obj.get_premium_info()

    def get_daily_limit(self, obj):
        return obj.get_daily_limit()

    def get_daily_tests_remaining(self, obj):
        return obj.get_daily_tests_remaining()

    def create(self, validated_data):
        # Check if username already exists
        username = validated_data.get('username')
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "A user with this username already exists."})

        # Handle password - if not provided, generate one
        password = validated_data.pop('password', None)
        if not password:
            # Generate a random password for new users
            import secrets
            import string
            alphabet = string.ascii_letters + string.digits
            password = ''.join(secrets.choice(alphabet) for i in range(12))

        user = super().create(validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        # Handle password updates - only update if provided
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user

    def to_representation(self, instance):
        # Add display_id to the response for frontend compatibility
        data = super().to_representation(instance)

        # Convert profile_photo to full URL if it exists
        if instance.profile_photo:
            request = self.context.get('request')
            if request:
                data['profile_photo'] = request.build_absolute_uri(instance.profile_photo.url)
            else:
                data['profile_photo'] = instance.profile_photo.url

        data['display_id'] = instance.username  # Use username as display_id
        return data

class TestSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    teacher_role = serializers.CharField(source='teacher.role', read_only=True)
    question_count = serializers.SerializerMethodField()
    attempt_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    average_time = serializers.SerializerMethodField()
    target_grades = serializers.CharField(required=False, default='', allow_blank=True)

    class Meta:
        model = Test
        fields = ['id', 'teacher', 'teacher_name', 'teacher_role', 'subject', 'title', 'description',
                  'total_questions', 'question_count', 'time_limit', 'difficulty', 'target_grades', 'created_at', 'is_active',
                  'attempt_count', 'average_score', 'average_time', 'is_premium', 'star_price']
        read_only_fields = ['id', 'created_at', 'teacher']

    def to_internal_value(self, data):
        # Convert target_grades list to comma-separated string
        if 'target_grades' in data:
            data = data.copy()
            if isinstance(data['target_grades'], list):
                data['target_grades'] = ','.join(data['target_grades'])
            elif isinstance(data['target_grades'], str):
                # If it's already a string, keep it as is
                pass
        
        # Ensure is_premium and star_price are captured correctly
        if 'is_premium' in data:
            if not isinstance(data, dict): # if it's a QueryDict
                data = data.copy()
            val = data.get('is_premium')
            if isinstance(val, str):
                data['is_premium'] = val.lower() == 'true'
        
        if 'star_price' in data:
            if not isinstance(data, dict):
                data = data.copy()
            try:
                data['star_price'] = int(data.get('star_price'))
            except (ValueError, TypeError):
                data['star_price'] = 0

        return super().to_internal_value(data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Convert comma-separated string back to list
        if instance.target_grades:
            data['target_grades'] = [grade.strip() for grade in instance.target_grades.split(',') if grade.strip()]
        else:
            data['target_grades'] = []
        return data

    def get_question_count(self, obj):
        if hasattr(obj, 'question_count_ann'):
            return obj.question_count_ann
        return obj.questions.count()

    def get_attempt_count(self, obj):
        if hasattr(obj, 'attempt_count_ann'):
            return obj.attempt_count_ann
        return obj.attempts.count()

    def get_average_score(self, obj):
        if hasattr(obj, 'average_score_ann'):
            return obj.average_score_ann or 0
        attempts = obj.attempts.all()
        if attempts.exists():
            return sum(attempt.score for attempt in attempts) / attempts.count()
        return 0

    def get_average_time(self, obj):
        if hasattr(obj, 'average_time_ann'):
            return obj.average_time_ann or 0
        attempts = obj.attempts.all()
        if attempts.exists():
            return sum(attempt.time_taken for attempt in attempts) / attempts.count()
        return 0

class QuestionSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    option_a_image = serializers.ImageField(required=False, allow_null=True)
    option_b_image = serializers.ImageField(required=False, allow_null=True)
    option_c_image = serializers.ImageField(required=False, allow_null=True)
    option_d_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Question
        fields = ['id', 'test', 'question_text', 'question_type', 'options',
                  'correct_answer', 'explanation', 'points', 'image',
                  'option_a_image', 'option_b_image', 'option_c_image', 'option_d_image']
        read_only_fields = ['id']

    def to_representation(self, instance):
        # Get the original representation
        data = super().to_representation(instance)

        # Convert image fields to full URLs
        image_fields = ['image', 'option_a_image', 'option_b_image', 'option_c_image', 'option_d_image']
        request = self.context.get('request')

        for field_name in image_fields:
            if getattr(instance, field_name, None):
                if request:
                    data[field_name] = request.build_absolute_uri(getattr(instance, field_name).url)
                else:
                    data[field_name] = getattr(instance, field_name).url

        return data

class TestAttemptSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    test_title = serializers.CharField(source='test.title', read_only=True)

    class Meta:
        model = TestAttempt
        fields = ['id', 'student', 'student_name', 'test', 'test_title', 'answers',
                 'score', 'submitted_at', 'time_taken']
        read_only_fields = ['id', 'submitted_at', 'student']

class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'attempt', 'student_feedback', 'teacher_feedback']
        read_only_fields = ['id']

class TestSessionSerializer(serializers.ModelSerializer):
    test_title = serializers.CharField(source='test.title', read_only=True)
    student_name = serializers.CharField(source='student.username', read_only=True)
    time_remaining = serializers.IntegerField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)

    class Meta:
        model = TestSession
        fields = ['id', 'session_id', 'test', 'test_title', 'student', 'student_name',
                  'started_at', 'expires_at', 'completed_at', 'answers', 'is_completed',
                  'is_expired', 'time_remaining', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'session_id', 'started_at', 'created_at', 'updated_at',
                           'test_title', 'student_name', 'time_remaining', 'is_active']


class PricingSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='get_plan_type_display', read_only=True)

    class Meta:
        model = Pricing
        fields = ['id', 'plan_type', 'plan_name', 'original_price', 'discounted_price',
                  'discount_percentage', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'plan_name']

class StarPackageSerializer(serializers.ModelSerializer):
    discount_text = serializers.SerializerMethodField()

    class Meta:
        model = StarPackage
        fields = ['id', 'stars', 'original_price', 'discounted_price', 'discount_percentage',
                  'discount_text', 'is_popular', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'discount_text']

    def get_discount_text(self, obj):
        if obj.discount_percentage > 0:
            return f"{obj.discount_percentage}% Chegirma"
        return ""


class PremiumPurchaseSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_username = serializers.CharField(source='student.username', read_only=True)
    purchase_type_name = serializers.CharField(source='get_purchase_type_display', read_only=True)
    plan_type_name = serializers.CharField(source='get_plan_type_display', read_only=True)
    
    class Meta:
        model = PremiumPurchase
        fields = ['id', 'student', 'student_name', 'student_username', 'purchase_type', 'purchase_type_name', 
                  'plan_type', 'plan_type_name', 'stars_used', 'money_spent', 'granted_date', 'expiry_date']

class ContactMessageSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='get_subject_display', read_only=True)
    status_name = serializers.CharField(source='get_status_display', read_only=True)
    replied_by_name = serializers.CharField(source='replied_by.username', read_only=True)
    
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone', 'subject', 'subject_name', 'message', 
                  'status', 'status_name', 'created_at', 'updated_at', 'replied_at', 
                  'admin_reply', 'replied_by', 'replied_by_name']
        read_only_fields = ['id', 'created_at', 'updated_at', 'replied_at', 'replied_by']


class SiteUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteUpdate
        fields = ['id', 'title_uz', 'description_uz', 'title_ru', 'description_ru', 'title_en', 'description_en', 
                  'title', 'description', 'media_type', 'media_file', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.media_file:
            request = self.context.get('request')
            if request:
                data['media_file'] = request.build_absolute_uri(instance.media_file.url)
            else:
                data['media_file'] = instance.media_file.url
        return data

