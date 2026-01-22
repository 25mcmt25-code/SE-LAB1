#include "Calculation.h"
#include "Student.h"

void set_total_marks(struct Student* s1)
{   int total=0;
    for(int i=0;i<5;i++){
        total+=s1->subjects[i].minor[0]+s1->subjects[i].minor[1]+s1->subjects[i].major;
    }
    s1->total_marks=total;
}

void set_percentage (struct Student* s1)
{
    s1->percentage=(s1->total_marks/500.0)*100;
}

void set_cgpa (struct Student* s1)
{
    if(s1->percentage>=90)
        s1->cgpa=10.0;
    else if(s1->percentage>=85)
        s1->cgpa=9.0;
    else if(s1->percentage>=75)
        s1->cgpa=8.0;
    else if(s1->percentage>=65)
        s1->cgpa=7.0;
    else if(s1->percentage>=60)
        s1->cgpa=6.0;
    else if(s1->percentage>=55)
        s1->cgpa=5.0;
    else if(s1->percentage>=50)
        s1->cgpa=4.0;
    else
        s1->cgpa=0.0;
}

void set_grade (struct Student* s1)
{
    if(s1->percentage>=90)
        strcpy(s1->grade,"O");
    else if(s1->percentage>=85)
        strcpy(s1->grade,"A+");
    else if(s1->percentage>=75)
        strcpy(s1->grade,"A");
    else if(s1->percentage>=65)
        strcpy(s1->grade,"B+");
    else if(s1->percentage>=60)
        strcpy(s1->grade,"B");
    else if(s1->percentage>=50)
        strcpy(s1->grade,"C");
    else if(s1->percentage>=40)
        strcpy(s1->grade,"D");
    else
        strcpy(s1->grade,"F");
}