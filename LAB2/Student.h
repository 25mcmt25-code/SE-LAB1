#ifndef STUDENT_H
#define STUDENT_H

struct subject{
   int minor[2];
   int major;
};

struct Student {
    char id[10];
    char name[50];
    struct subject subjects[5];
    int total_marks;
    float percentage;
    char grade[3];
    float cgpa;
    struct Student * next;
};

struct Student* student_create(char id[10], char name[50], struct subject subjects[5]);
struct Student* insert_student(struct Student * head, struct Student * student);
int search_by_id(struct Student* head , const char * id);
void print_student_results(struct Student* s1,FILE* fptr);
#endif