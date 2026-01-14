#include<stdio.h>
#include<stdlib.h>
#include<ctype.h>
#include<string.h>
struct Student{
    char id[10];
    char name[50];
    int minor[5];
    int major[5];
    int total_marks;
    float percentage;
    char grade[2];
    float cgpa;
};

struct Student_list
    {
       struct Student * data;
       struct Student_list * next;
    };

int search_student_by_id(struct Student_list *head, char *id) {
    while (head != NULL) {
        if (strcmp(head->data->id, id) == 0)
            return 1;
        head = head->next;
    }
    return 0;
}

int is_valid_id(char id[10],struct Student_list * head){
    int valid = 1; 
    int i = 0;
    while(id[i] != '\0'){
        if (!isalnum(id[i])) {
            valid = 0; 
            break;
        }
        i++;
    }
     if(search_student_by_id(head, id)){
        valid=0;
    }
    return valid;
}

int is_valid_name(char name[50]){
int valid = 1; 
    int i = 0;
    while(name[i] != '\0'){
        if ( !isalpha(name[i]) && name[i] != ' ') {
            valid = 0; 
            break;
        }
        i++;
    }
    return valid;
}

int is_valid_minor_marks(int marks){
    return (marks>=0 && marks<=40);
}

int is_valid_major_marks(int marks){
    return (marks>=0 && marks<=60);
}

int total_marks(int minor[5], int major[5]){
    int total=0;
    for(int i=0;i<5;i++){
        total+=minor[i]+major[i];
    }
    return total;
}

const char* grade(float percentage){
    if(percentage>=90)
        return "O";
    else if(percentage>=85)
        return "A+";
    else if(percentage>=75)
        return "A";
    else if(percentage>=65)
        return "B+";
    else if(percentage>=60)
        return "B";
    else if(percentage>=55)
        return "C";
    else if(percentage>=50)
        return "D";
    else
        return "F";
}

struct Student_list * insert_student(struct Student_list * head, struct Student * student){
    struct Student_list * new_node = (struct Student_list *)malloc(sizeof(struct Student_list));
    new_node->data = student;
    new_node->next = head;
    head = new_node;
    return head;
}
float cgpa(float percentage){
    if(percentage>=90)
        return 10.0;
    else if(percentage>=85)
        return 9.0;
    else if(percentage>=75)
        return 8.0;
    else if(percentage>=65)
        return 7.0;
    else if(percentage>=60)
        return 6.0;
    else if(percentage>=55)
        return 5.0;
    else if(percentage>=50)
        return 4.0;
    else
        return 0.0;
}

struct Student_list* create_student(int n)
{
    struct Student_list * head = NULL;
    while(n!=0){
        struct Student * student = (struct Student *)malloc(sizeof(struct Student));
        printf("\nEnter Student ID :");
        while(1)
        {   scanf("%s",student->id);
            if(is_valid_id(student->id,head))
                break;
            printf("Enter valid Student ID :");
        }
        printf("Enter Student name : ");
        while(1)
        {   scanf(" %[^\n]", student->name);
            if(is_valid_name(student->name))
                break;
            printf("Enter valid Student name :");
        }
        for(int i=0;i<5;i++){
            printf("Enter subject %d minor marks: ",i+1);
            while(1){
                scanf("%d",&student->minor[i]);
            if(is_valid_minor_marks(student->minor[i]))
                break;
            printf("Enter valid subject %d minor marks :",i+1);
            }
            printf("Enter subject %d major marks: ",i+1);
            while(1){
                scanf("%d",&student->major[i]);
            if(is_valid_major_marks(student->major[i]))
                break;
            printf("Enter valid subject %d major marks :",i+1);
            }
        }
        student->total_marks=total_marks(student->minor , student->major);
        student->percentage=(student->total_marks/500.0)*100;
        student->cgpa=cgpa(student->percentage);
        strcpy(student->grade, grade(student->percentage));
        n--;
        head=insert_student(head,student);
    }
    return head;
}

void print_students(struct Student_list * head , FILE *fp){
    struct Student_list * current = head;
    fprintf(fp,"ID\t\tName\tTotal Marks\tPercentage\tGrade\tCGPA\n");
    while(current != NULL){
        struct Student * student = current->data;
        fprintf(fp,"%s,  \t%s,  \t%d,  \t%.2f,  \t%s,  \t%.2f\n",
               student->id, student->name, student->total_marks, student->percentage, student->grade, student->cgpa);
        current = current->next;
    }
}

void Highest_percentage_and_lowest_percentage_average_percentage(struct Student_list * head, FILE *fp){
    if(head == NULL){
        fprintf(fp,"No students in the list.\n");
        return ;
    }
    float highest = head->data->percentage;
    float lowest = head->data->percentage;
    float total = 0;
    int count = 0;
    struct Student_list * current = head;
    while(current != NULL){
        total += current->data->percentage;
        count++;
        if(current->data->percentage > highest){
            highest = current->data->percentage;
        }
        if(current->data->percentage < lowest){
            lowest = current->data->percentage;
        }
        current = current->next;
    }
    fprintf(fp,"Highest Percentage: %.2f\n", highest);
    fprintf(fp,"Lowest Percentage: %.2f\n", lowest);
    fprintf(fp,"Average Percentage: %.2f\n", total / count);
}

void Number_of_students_in_each_grade(struct Student_list * head, FILE *fp){
    int grade_count[8] = {0}; 
    struct Student_list * current = head;

    while (current != NULL) {

    if (strcmp(current->data->grade, "O") == 0)
        grade_count[0]++;
    else if (strcmp(current->data->grade, "A+") == 0)
        grade_count[1]++;
    else if (strcmp(current->data->grade, "A") == 0)
        grade_count[2]++;
    else if (strcmp(current->data->grade, "B+") == 0)
        grade_count[3]++;
    else if (strcmp(current->data->grade, "B") == 0)
        grade_count[4]++;
    else if (strcmp(current->data->grade, "C") == 0)
        grade_count[5]++;
    else if (strcmp(current->data->grade, "D") == 0)
        grade_count[6]++;
    else if (strcmp(current->data->grade, "F") == 0)
        grade_count[7]++;

    current = current->next;
}


    fprintf(fp,"Number of students in each grade:\n");
    fprintf(fp,"O\tA+\tA\tB+\tB\tC\tD\tF\n");
    fprintf(fp,"%d\t%d\t%d\t%d\t%d\t%d\t%d\t%d\n",
           grade_count[0], grade_count[1],
           grade_count[2], grade_count[3],
           grade_count[4], grade_count[5],
           grade_count[6], grade_count[7]);
}

int main(){
    FILE *fp = fopen("student_records.txt", "w");
    if (fp == NULL) {
        printf("File cannot be opened!\n");
    }
    int n;
    printf("Enter number of students: ");
    scanf("%d",&n);
    struct Student_list * head = create_student(n);
    print_students(head,fp);
    Highest_percentage_and_lowest_percentage_average_percentage(head,fp);
    Number_of_students_in_each_grade(head,fp);
    fclose(fp);
    return 0;
}

