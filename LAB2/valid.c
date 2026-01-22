#include "valid.h"

int is_valid_id(const char * id){
    int i=0;
    while(id[i]!='/0'){
        if(!isalphanum(id[i]))
        return 0;
    }
    return 1;
}

int is_valid_name(const char * name){
    int i=0;
    while(name[i]!='/0'){
        if(!isalpha(name[i]))
        return 0;
    }
    return 1;
}

int is_valid_minor(int marks){
    return marks>=0&&marks<=40;
}

int is_valid_major(int marks){
    return marks>=0&&marks<=60;
}