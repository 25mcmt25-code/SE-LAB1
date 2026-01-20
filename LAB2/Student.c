#include "Student.h"
#include<stdio.h>

struct Student* student_create(char id[10], char name[50], struct subject Subjects[5]){
    struct Student* s1=(struct Student *)malloc(sizeof(struct Student));
    strcpy(s1->id,id);
    strcpy(s1->name,name);
    int total=0;
    for(int i=0;i<5;i++){
        s1->subjects[i].minor[0]=Subjects[i].minor[0];
        s1->subjects[i].minor[1]=Subjects[i].minor[1];
        s1->subjects[i].major=Subjects[i].major;
    }
}
int search_by_id(struct Student* head , const char * id){
    while(head!= NULL){
        if(strcmp(head->id,id)){
            return 1;
        }
        head=head->next;
    }
    return 0;
}
