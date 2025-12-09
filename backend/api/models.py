from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Teacher'),
        ('student', 'Student'),
        ('seller', 'Seller'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    name = models.CharField(max_length=100, blank=True)
    display_id = models.CharField(max_length=50, blank=True, help_text="Human-readable ID like AHMEDOV_A_11_N")
    registration_date = models.DateField(null=True, blank=True, help_text="Student registration date")
    created_at = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    
    # Additional fields for students
    class_group = models.CharField(max_length=10, blank=True, help_text="Class group like 5-01")
    direction = models.CharField(max_length=20, blank=True, help_text="Student direction (natural/exact)")

    # For sellers
    seller_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Total earnings from premium sales commission")

    # For teachers
    subjects = models.JSONField(default=list, blank=True)  # Array of subject names
    bio = models.TextField(blank=True)
    total_tests_created = models.IntegerField(default=0)
    average_student_score = models.FloatField(default=0.0)
    is_curator = models.BooleanField(default=False, help_text="Is this teacher a class curator?")
    curator_class = models.CharField(max_length=10, blank=True, null=True, help_text="Curator class like 5-01")

    # For students
    total_tests_taken = models.IntegerField(default=0)
    average_score = models.FloatField(default=0.0)
    completed_subjects = models.JSONField(default=list, blank=True)

    # Ban system
    is_banned = models.BooleanField(default=False, help_text="Whether the user is banned")
    ban_reason = models.TextField(blank=True, help_text="Reason for banning")
    ban_date = models.DateTimeField(null=True, blank=True, help_text="When the user was banned")
    unban_code = models.CharField(max_length=4, blank=True, help_text="4-digit code to unban the user")

    # Premium profile system (for students)
    is_premium = models.BooleanField(default=False, help_text="Whether the student has premium status")
    premium_granted_date = models.DateTimeField(null=True, blank=True, help_text="When premium was granted")
    premium_expiry_date = models.DateTimeField(null=True, blank=True, help_text="When premium expires")
    premium_plan = models.CharField(max_length=10, blank=True, help_text="Premium plan type (week/month/year)")
    premium_cost = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Cost of premium subscription in USD")
    premium_type = models.CharField(max_length=20, default='time_based', help_text="Type of premium: time_based or performance_based")
    premium_balance = models.IntegerField(default=0, help_text="Premium balance for performance-based premium (decreases with usage)")
    stars = models.IntegerField(default=0, help_text="Number of stars the student has")
    profile_photo = models.ImageField(upload_to='profile_photos/', blank=True, null=True, help_text="Profile photo (can be GIF)")
    profile_status = models.CharField(max_length=100, blank=True, help_text="Custom status message")
    premium_emoji_count = models.IntegerField(default=0, help_text="Number of premium emojis available")
    background_gradient = models.JSONField(default=dict, blank=True, help_text="Background gradient settings for premium profile")
    selected_emojis = models.JSONField(default=list, blank=True, help_text="List of selected premium emojis")
    display_gift = models.ForeignKey('StudentGift', on_delete=models.SET_NULL, null=True, blank=True, related_name='displayed_by', help_text="Gift selected for display next to name")

    def save(self, *args, **kwargs):
        # Auto-generate display_id if not set and user is student/teacher
        if not self.display_id and self.role in ['student', 'teacher']:
            self.generate_display_id()

        # Auto-generate email if not set
        if not self.email and self.username:
            self.generate_email()

        # If username is not set but we have name, generate username from name
        if not self.username and self.first_name and self.last_name:
            # Create username from display_id for consistency
            if self.display_id:
                self.username = self.display_id

        # Premium status is managed manually or through purchases

        super().save(*args, **kwargs)

    # Premium status is managed manually

    def get_premium_info(self):
        """Get premium information including remaining time/balance"""
        if not self.is_premium:
            return {
                'is_premium': False,
                'type': None,
                'remaining': None,
                'message': 'Premium yo\'q',
                'granted_date': None,
                'expiry_date': None
            }

        if self.premium_type == 'time_based' and self.premium_expiry_date:
            from django.utils import timezone
            now = timezone.now()
            if now >= self.premium_expiry_date:
                # Premium expired
                return {
                    'is_premium': False,
                    'type': 'time_based',
                    'remaining': 0,
                    'message': 'Premium muddati tugagan',
                    'granted_date': self.premium_granted_date,
                    'expiry_date': self.premium_expiry_date
                }

            # Calculate remaining time
            remaining_delta = self.premium_expiry_date - now
            days = remaining_delta.days
            hours = remaining_delta.seconds // 3600
            minutes = (remaining_delta.seconds % 3600) // 60

            remaining_text = []
            if days > 0:
                remaining_text.append(f'{days} kun')
            if hours > 0:
                remaining_text.append(f'{hours} soat')
            if minutes > 0 and days == 0:
                remaining_text.append(f'{minutes} daqiqa')

            return {
                'is_premium': True,
                'type': 'time_based',
                'remaining': remaining_delta.total_seconds(),
                'message': f"{' '.join(remaining_text)} qoldi" if remaining_text else 'Tez orada tugaydi',
                'granted_date': self.premium_granted_date,
                'expiry_date': self.premium_expiry_date,
                'plan': self.premium_plan,
                'cost': self.premium_cost
            }

        elif self.premium_type == 'performance_based':
            return {
                'is_premium': True,
                'type': 'performance_based',
                'remaining': self.premium_balance,
                'message': f'{self.premium_balance} premium ball qoldi',
                'granted_date': self.premium_granted_date,
                'expiry_date': None,
                'plan': 'Performance-based',
                'cost': 0
            }

        return {
            'is_premium': True,
            'type': self.premium_type,
            'remaining': None,
            'message': 'Premium faol',
            'granted_date': self.premium_granted_date,
            'expiry_date': self.premium_expiry_date
        }

    def use_premium_balance(self, amount=1):
        """Use premium balance for performance-based premium"""
        if self.premium_type == 'performance_based' and self.premium_balance >= amount:
            self.premium_balance -= amount
            if self.premium_balance <= 0:
                self.is_premium = False
                self.premium_balance = 0
                self.premium_emoji_count = 0
            return True
        return False

    def generate_display_id(self):
        """Generate a display ID for student/teacher based on name and role"""
        if not self.name and not (self.first_name and self.last_name):
            # Fallback to username if no name data
            self.display_id = self.username
            return
        
        # Use first_name and last_name if available, otherwise parse from name
        if self.first_name and self.last_name:
            first = self.first_name.upper()
            last = self.last_name.upper()
        else:
            # Parse from name field
            name_parts = self.name.upper().split() if self.name else []
            first = name_parts[0] if name_parts else 'STUDENT'
            last = name_parts[1] if len(name_parts) > 1 else 'X'
        
        # Generate random 3 digits
        import random
        random_digits = str(random.randint(100, 999))
        
        if self.role == 'student':
            # For students: JAHONGIRT903@test
            grade = getattr(self, 'class_group', '9') or '9'
            direction = (getattr(self, 'direction', 'natural') or 'natural')[0].upper()
            self.display_id = f"{last}{first[0]}T{grade}{direction}{random_digits}@test"
        elif self.role == 'teacher':
            # For teachers: MAFTUNASUSTOZ903@test
            self.display_id = f"{last}{first}USTOZ{random_digits}@test"
        else:
            # For admin, use email as display_id
            self.display_id = self.email
    
    def generate_email(self):
        """Generate email address based on role and display_id"""
        if self.role == 'admin':
            self.email = 'admin@testplatform.com'
        elif self.role == 'student':
            # Generate student email
            base_email = self.display_id.replace('@test', '').lower() + '@student.testplatform.com'
            # Replace special characters for email
            base_email = base_email.replace("'", '').replace('-', '').replace('_', '')
            self.email = base_email
        elif self.role == 'teacher':
            # Generate teacher email
            base_email = self.display_id.replace('@test', '').lower() + '@teacher.testplatform.com'
            # Replace special characters for email
            base_email = base_email.replace("'", '').replace('-', '').replace('_', '')
            self.email = base_email
    
    def __str__(self):
        return self.username

class Test(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Oson'),
        ('medium', 'O\'rtacha'),
        ('hard', 'Qiyin'),
    ]
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tests')
    subject = models.CharField(max_length=100)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    total_questions = models.IntegerField(default=0)
    time_limit = models.IntegerField(help_text="Time limit in minutes")
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='medium')
    target_grades = models.CharField(max_length=200, default='', blank=True, help_text="Comma-separated list of grades this test is for, empty for all grades")
    created_at = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title

class Question(models.Model):
    QUESTION_TYPES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
    ]
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    options = models.JSONField(default=list, blank=True)  # For multiple choice
    correct_answer = models.TextField()
    explanation = models.TextField(blank=True)
    points = models.IntegerField(default=1)
    image = models.ImageField(upload_to='question_images/', blank=True, null=True)
    # Option images
    option_a_image = models.ImageField(upload_to='question_images/', blank=True, null=True)
    option_b_image = models.ImageField(upload_to='question_images/', blank=True, null=True)
    option_c_image = models.ImageField(upload_to='question_images/', blank=True, null=True)
    option_d_image = models.ImageField(upload_to='question_images/', blank=True, null=True)

    def __str__(self):
        return f"Question for {self.test.title}"

class TestAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attempts')
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='attempts')
    answers = models.JSONField(default=dict)  # question_id: answer
    score = models.FloatField()  # Percentage 0-100
    submitted_at = models.DateTimeField(default=timezone.now)
    time_taken = models.IntegerField(help_text="Time taken in minutes")

    def __str__(self):
        return f"{self.student.username} - {self.test.title}"

class TestSession(models.Model):
    """Model to track server-side test sessions with persistent timer"""
    session_id = models.CharField(max_length=100, unique=True, help_text="Unique session identifier")
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='sessions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='test_sessions')
    started_at = models.DateTimeField(help_text="When the test session started")
    expires_at = models.DateTimeField(help_text="When the test session expires")
    completed_at = models.DateTimeField(blank=True, null=True, help_text="When the test was completed")
    answers = models.JSONField(default=dict, help_text="Student answers during the session")
    is_completed = models.BooleanField(default=False, help_text="Whether the test session is completed")
    is_expired = models.BooleanField(default=False, help_text="Whether the test session has expired")

    # Anti-cheating tracking
    warning_count = models.IntegerField(default=0, help_text="Number of warnings issued in this session")
    unban_prompt_shown = models.BooleanField(default=False, help_text="Whether the unban prompt has been shown")
    is_banned_in_session = models.BooleanField(default=False, help_text="Whether student was banned during this session")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'test']),
            models.Index(fields=['session_id']),
        ]

    def __str__(self):
        return f"Session {self.session_id} - {self.student.username} - {self.test.title}"

    @property
    def time_remaining(self):
        """Calculate remaining time in seconds"""
        if self.is_completed or self.is_expired:
            return 0
        
        from django.utils import timezone
        now = timezone.now()
        if now >= self.expires_at:
            return 0
        
        return int((self.expires_at - now).total_seconds())

    @property
    def is_active(self):
        """Check if session is still active"""
        return not self.is_completed and not self.is_expired and self.time_remaining > 0

    def mark_expired(self):
        """Mark session as expired"""
        if not self.is_completed:
            self.is_expired = True
            self.save()

    def complete(self):
        """Mark session as completed"""
        self.is_completed = True
        from django.utils import timezone
        self.completed_at = timezone.now()
        self.save()

class WarningLog(models.Model):
    """Model to track anti-cheating warnings during test sessions"""
    session = models.ForeignKey(TestSession, on_delete=models.CASCADE, related_name='warnings')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='warning_logs')
    warning_type = models.CharField(max_length=100, help_text="Type of warning (tab_switch, f12, screenshot, etc.)")
    warning_message = models.TextField(help_text="The warning message shown to the student")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Warning for {self.student.username} - {self.warning_type}"

class Feedback(models.Model):
    attempt = models.OneToOneField(TestAttempt, on_delete=models.CASCADE, related_name='feedback')
    student_feedback = models.JSONField(default=dict)
    teacher_feedback = models.JSONField(default=dict)

    def __str__(self):
        return f"Feedback for {self.attempt}"

class Pricing(models.Model):
    """Model to manage premium subscription pricing"""
    PLAN_CHOICES = [
        ('week', '1 Hafta'),
        ('month', '1 Oy'),
        ('year', '1 Yil'),
    ]

    plan_type = models.CharField(max_length=10, choices=PLAN_CHOICES, unique=True)
    original_price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Original price in USD")
    discounted_price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Discounted price in USD")
    discount_percentage = models.IntegerField(default=0, help_text="Discount percentage")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.get_plan_type_display()} - ${self.discounted_price}"

    class Meta:
        ordering = ['plan_type']

class StarPackage(models.Model):
    """Model to manage star packages pricing"""
    stars = models.IntegerField(help_text="Number of stars in this package")
    original_price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Original price in USD")
    discounted_price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Discounted price in USD")
    discount_percentage = models.IntegerField(default=0, help_text="Discount percentage")
    is_popular = models.BooleanField(default=False, help_text="Whether this package is marked as popular")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.stars} stars - ${self.discounted_price}"

    class Meta:
        ordering = ['stars']

class Gift(models.Model):
    """Model to manage gift items that students can purchase with stars"""
    RARITY_CHOICES = [
        ('common', 'Oddiy'),
        ('rare', 'Nodirkor'),
        ('epic', 'Epik'),
        ('legendary', 'Afsonaviy'),
    ]
    name = models.CharField(max_length=100, help_text="Name of the gift")
    description = models.TextField(blank=True, help_text="Description of the gift")
    image = models.ImageField(upload_to='gifts/', help_text="Gift image (should be 300x300px)")
    star_cost = models.IntegerField(help_text="Number of stars required to purchase this gift")
    rarity = models.CharField(max_length=20, choices=RARITY_CHOICES, default='common', help_text="Rarity level of the gift")
    gift_count = models.IntegerField(default=0, help_text="Total available quantity of this gift (0 = unlimited)")
    is_active = models.BooleanField(default=True, help_text="Whether this gift is available for purchase")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.star_cost} stars"

    class Meta:
        ordering = ['star_cost']

class StudentGift(models.Model):
    """Model to track gifts purchased by students"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchased_gifts')
    gift = models.ForeignKey(Gift, on_delete=models.CASCADE, related_name='purchases')
    purchased_at = models.DateTimeField(default=timezone.now)
    is_placed = models.BooleanField(default=False, help_text="Whether this gift is placed on the student's profile")
    placement_position = models.IntegerField(null=True, blank=True, help_text="Position on profile (1-3)")

    def __str__(self):
        return f"{self.student.name} - {self.gift.name}"

    class Meta:
        ordering = ['-purchased_at']
        unique_together = ['student', 'placement_position']  # Only one gift per position
