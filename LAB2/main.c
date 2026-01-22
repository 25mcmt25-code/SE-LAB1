#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "Student.h"
#include "Calculation.h"
#include "valid.h"
#include "process.h"

int main() {
    int num_students;
    printf("Enter the number of students: ");
    scanf("%d", &num_students);

    struct Student* head = NULL;
    struct Student* temp = NULL;

    for (int i = 0; i < num_students; i++) {
        char id[10];
        char name[50];
        struct subject subj[5];
        while(1){
        printf("Enter ID for student %d: ", i + 1);
        scanf("%s",id);
          if (!is_valid_name(name)) {
            printf("Invalid ID . Enter Again .\n");}
          else 
            break; }

       while(1){
        printf("Enter name of student %d: ", i + 1);
        scanf("%s",id);
          if (!is_valid_name(name)) {
            printf("Invalid name . Enter Again .\n");}
          else 
            break; }


        for (int j = 0; j < 5; j++) {
            while(1) {
            printf("Enter minor1, minor2, major for subject %d: ", j + 1);
            scanf("%d %d %d", &subj[j].minor[0], &subj[j].minor[1], &subj[j].major);
            if (!is_valid_minor(subj[j].minor[0]) || !is_valid_minor(subj[j].minor[1]) || !is_valid_major(subj[j].major)) {
                printf("Invalid marks. Enter Again.\n");
            } else {
                break;
            }
            }
        }

        temp = student_create(id, name, subj);
        set_total_marks(temp);
        set_percentage(temp);
        set_cgpa(temp);
        set_grade(temp);

        if (head == NULL) {
            head = temp;
        } else {
            head = insert_student(head, temp);
        }

    }

    FILE* fp = fopen("output.txt", "w");
    if (fp == NULL) {
        printf("Error opening file.\n");
        return 1;
    }

    calculate_percentage_stats(head, fp);
    fprintf(fp, "\n");
    number_of_students_in_each_grade(head, fp);
    fprintf(fp, "\n");
    print_student_results(head, fp);
    fclose(fp);

    struct Student* current = head;
    while (current != NULL) {
        struct Student* next = current->next;
        free(current);
        current = next;
    }

    printf("Results written to output.txt\n");
    return 0;
}