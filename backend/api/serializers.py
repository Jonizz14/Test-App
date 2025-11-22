from rest_framework import serializers
from .models import User, Test, Question, TestAttempt, Feedback, TestSession

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    username = serializers.CharField(validators=[])  # Remove default username validators
    email = serializers.EmailField(validators=[])  # Remove default email validators

    class Meta:
        model = User
        fields = ['id', 'username', 'display_id', 'email', 'password', 'role', 'name', 'first_name', 'last_name',
                 'created_at', 'last_login', 'class_group', 'direction', 'registration_date',
                 'subjects', 'bio', 'total_tests_created', 'average_student_score', 'is_curator', 'curator_class',
                 'total_tests_taken', 'average_score', 'completed_subjects']
        read_only_fields = ['id', 'created_at', 'last_login', 'display_id']

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
        data['display_id'] = instance.username  # Use username as display_id
        return data

class TestSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.username', read_only=True)
    question_count = serializers.SerializerMethodField()
    attempt_count = serializers.SerializerMethodField()
    average_score = serializers.SerializerMethodField()
    average_time = serializers.SerializerMethodField()

    class Meta:
        model = Test
        fields = ['id', 'teacher', 'teacher_name', 'subject', 'title', 'description',
                  'total_questions', 'question_count', 'time_limit', 'difficulty', 'target_grades', 'created_at', 'is_active',
                  'attempt_count', 'average_score', 'average_time']
        read_only_fields = ['id', 'created_at', 'teacher']

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

    class Meta:
        model = Question
        fields = ['id', 'test', 'question_text', 'question_type', 'options',
                 'correct_answer', 'explanation', 'points', 'image']
        read_only_fields = ['id']

    def to_representation(self, instance):
        # Get the original representation
        data = super().to_representation(instance)
        
        # Convert image field to full URL
        if instance.image:
            # Get the request object from context
            request = self.context.get('request')
            if request:
                # Build the full URL
                data['image'] = request.build_absolute_uri(instance.image.url)
            else:
                # Fallback to relative URL if request is not available
                data['image'] = instance.image.url
        
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