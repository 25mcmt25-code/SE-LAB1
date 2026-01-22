#ifndef PROCESS_H
#define PROCESS_H

#include "Student.h"
#include "valid.h"
#include "Calculation.h"
#include<stdlib.h>
#include<stdio.h>

void Highest_percentage_and_lowest_percentage_average_percentage(struct Student * head, FILE *fp);
void Number_of_students_in_each_grade(struct Student * head, FILE *fp);

#endif