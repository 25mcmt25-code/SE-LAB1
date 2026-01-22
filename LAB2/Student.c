#include "Student.h"
#include<string.h>
#include<stdio.h>

struct Student* student_create(char id[10], char name[50], struct subject Subjects[5]){
    struct Student* s1=(struct Student *)malloc(sizeof(struct Student));
    strcpy(s1->id,id);
    strcpy(s1->name,name);
    for(int i=0;i<5;i++){
        s1->subjects[i].minor[0]=Subjects[i].minor[0];
        s1->subjects[i].minor[1]=Subjects[i].minor[1];
        s1->subjects[i].major=Subjects[i].major;
    }
    s1->total_marks=0;
    s1->percentage=0.0;
    s1->cgpa=0.0;
    strcpy(s1->grade,"\0");
    return s1;
}
int search_by_id(struct Student* head , const char * id){
    while(head!= NULL){
        if(strcmp(head->id,id)==0){
            return 1;
        }
        head=head->next;
    }
    return 0;
}

struct Student* insert_student(struct Student * head, struct Student * student){
    struct Student * new_node = (struct Student *)malloc(sizeof(struct Student));
    head->next = student;
    return head;
}

void print_student_results(struct Student* head,FILE * fptr){
    fprintf(fptr,"Student Results:\nID\tName\tTotal Marks\tPercentage\tGrade\tCGPA\n");
    while(head!= NULL){
        fprintf(fptr,"%s\t%s\t%d\t%.2f\t%s\t%.2f\n",head->id,head->name,head->total_marks,head->percentage,head->grade,head->cgpa);
        head=head->next;
    }
}
