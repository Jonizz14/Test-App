from rest_framework import serializers
from .models import User, Test, Question, TestAttempt, Feedback, TestSession, WarningLog, Pricing, StarPackage, Gift, StudentGift

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(validators=[])  # Remove default username validators
    email = serializers.EmailField(validators=[])  # Remove default email validators

    profile_photo_url = serializers.SerializerMethodField()
    premium_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'display_id', 'email', 'password', 'role', 'name', 'first_name', 'last_name',
                  'created_at', 'last_login', 'class_group', 'direction', 'registration_date',
                  'seller_earnings', 'subjects', 'bio', 'total_tests_created', 'average_student_score', 'is_curator', 'curator_class',
                  'total_tests_taken', 'average_score', 'completed_subjects', 'stars',
                  'is_banned', 'ban_reason', 'ban_date', 'unban_code',
                  'is_premium', 'premium_granted_date', 'premium_expiry_date', 'premium_plan', 'premium_cost', 'premium_type', 'premium_balance',
                  'profile_photo', 'profile_photo_url', 'profile_status', 'premium_emoji_count',
                  'background_gradient', 'selected_emojis', 'display_gift', 'premium_info',
                  'hide_premium_from_others', 'hide_premium_from_self']
        read_only_fields = ['id', 'created_at', 'last_login', 'display_id']

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

    def create(self, validated_data):
        # Check if username already exists
        username = validated_data.get('username')
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "A user with this username already exists."})
        
        password = validated_data.pop('password')
        user = super().create(validated_data)
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
    question_count = serializers.SerializerMethodField()
    attempt_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    average_time = serializers.SerializerMethodField()
    target_grades = serializers.CharField(required=False, default='')

    class Meta:
        model = Test
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'title', 'description',
                  'total_questions', 'question_count', 'time_limit', 'difficulty', 'target_grades', 'created_at', 'is_active',
                  'attempt_count', 'average_score', 'average_time']
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
        return obj.questions.count()

    def get_attempt_count(self, obj):
        return obj.attempts.count()

    def get_average_score(self, obj):
        attempts = obj.attempts.all()
        if attempts.exists():
            return sum(attempt.score for attempt in attempts) / attempts.count()
        return 0

    def get_average_time(self, obj):
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
                  'is_expired', 'time_remaining', 'is_active', 'warning_count', 'unban_prompt_shown',
                  'is_banned_in_session', 'created_at', 'updated_at']
        read_only_fields = ['id', 'session_id', 'started_at', 'created_at', 'updated_at',
                           'test_title', 'student_name', 'time_remaining', 'is_active']

class WarningLogSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.username', read_only=True)
    session_id = serializers.CharField(source='session.session_id', read_only=True)

    class Meta:
        model = WarningLog
        fields = ['id', 'session', 'session_id', 'student', 'student_name', 'warning_type',
                  'warning_message', 'created_at']
        read_only_fields = ['id', 'created_at', 'student_name', 'session_id']

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

class GiftSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    rarity_display = serializers.CharField(source='get_rarity_display', read_only=True)

    class Meta:
        model = Gift
        fields = ['id', 'name', 'description', 'image', 'image_url', 'star_cost', 'rarity', 'rarity_display', 'gift_count', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'image_url', 'rarity_display']

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            else:
                return obj.image.url
        return None

class StudentGiftSerializer(serializers.ModelSerializer):
    gift_name = serializers.CharField(source='gift.name', read_only=True)
    gift_image_url = serializers.SerializerMethodField()
    gift_rarity = serializers.CharField(source='gift.rarity', read_only=True)
    gift_rarity_display = serializers.CharField(source='gift.get_rarity_display', read_only=True)
    student_name = serializers.CharField(source='student.name', read_only=True)
    gift_number = serializers.SerializerMethodField()

    class Meta:
        model = StudentGift
        fields = ['id', 'student', 'student_name', 'gift', 'gift_name', 'gift_image_url', 'gift_rarity', 'gift_rarity_display', 'gift_number', 'purchased_at', 'is_placed', 'placement_position']
        read_only_fields = ['id', 'purchased_at', 'gift_name', 'gift_image_url', 'gift_rarity', 'gift_rarity_display', 'student_name', 'gift_number']

    def get_gift_image_url(self, obj):
        if obj.gift.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.gift.image.url)
            else:
                return obj.gift.image.url
        return None

    def get_gift_number(self, obj):
        # Get the count of StudentGift objects created before this one
        return StudentGift.objects.filter(purchased_at__lt=obj.purchased_at).count() + 1