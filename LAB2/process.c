#include "process.h"
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

void calculate_percentage_stats(struct Student* head, FILE *fp) {
    if (fp == NULL) return;

    if (head == NULL) {
        fprintf(fp, "No students in the list.\n");
        return;
    }

    float highest = head->percentage;
    float lowest  = head->percentage;
    float total   = 0.0f;
    int count     = 0;

    struct Student *current = head;

    while (current != NULL) {
        float p = current->percentage;

        total += p;
        count++;

        if (p > highest) highest = p;
        if (p < lowest)  lowest  = p;

        current = current->next;
    }

    fprintf(fp, "Highest Percentage : %.2f\n", highest);
    fprintf(fp, "Lowest Percentage  : %.2f\n", lowest);
    fprintf(fp, "Average Percentage : %.2f\n", total / count);
}

void number_of_students_in_each_grade(struct Student *head, FILE *fp) {
    if (fp == NULL) return;

    if (head == NULL) {
        fprintf(fp, "No students in the list.\n");
        return;
    }

    int grade_count[8] = {0};
    struct Student *current = head;

    while (current != NULL) {

        if (strcmp(current->grade, "O") == 0)
            grade_count[0]++;
        else if (strcmp(current->grade, "A+") == 0)
            grade_count[1]++;
        else if (strcmp(current->grade, "A") == 0)
            grade_count[2]++;
        else if (strcmp(current->grade, "B+") == 0)
            grade_count[3]++;
        else if (strcmp(current->grade, "B") == 0)
            grade_count[4]++;
        else if (strcmp(current->grade, "C") == 0)
            grade_count[5]++;
        else if (strcmp(current->grade, "D") == 0)
            grade_count[6]++;
        else if (strcmp(current->grade, "F") == 0)
            grade_count[7]++;

        current = current->next;
    }

    fprintf(fp, "Number of students in each grade:\n");
    fprintf(fp, "O\tA+\tA\tB+\tB\tC\tD\tF\n");
    fprintf(fp, "%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\n",
            grade_count[0], grade_count[1],
            grade_count[2], grade_count[3],
            grade_count[4], grade_count[5],
            grade_count[6], grade_count[7]);
}
