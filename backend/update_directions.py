#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'testplatform.settings')
django.setup()

from api.models import User

def update_student_directions():
    students = User.objects.filter(role='student')
    updated_count = 0
    
    print(f"Found {students.count()} students")
    
    for i, student in enumerate(students):
        if not student.direction:  # Only update if direction is empty
            if i % 2 == 0:
                student.direction = 'natural'
            else:
                student.direction = 'exact'
            student.save()
            updated_count += 1
            print(f"Updated {student.username}: direction = {student.direction}")
    
    print(f"Updated {updated_count} students")

if __name__ == "__main__":
    update_student_directions()