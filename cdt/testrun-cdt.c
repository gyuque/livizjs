#include <cdt.h>
#include <stdio.h>
#include <malloc.h>

struct TestSym {
	const char* key;
	int val;
};

int main() {
	struct TestSym* sym;
	struct TestSym* sym2;
	struct TestSym* sp;
	int i;

	Dt_t* dict;
	static Dtdisc_t symdisc = {
		0,	/* key */
		-1,			/* size */
		-1,			/* link */
		(Dtmake_f) 0,
		(Dtfree_f) 0,
		(Dtcompar_f) 0,		/* use strcmp */
		(Dthash_f) 0,
		(Dtmemory_f) 0,
		(Dtevent_f) 0
    };

	sym = (struct TestSym*)malloc(sizeof(struct TestSym));
	sym->key = "test1";
	sym->val = 4649;

	sym2 = (struct TestSym*)malloc(sizeof(struct TestSym));
	sym2->key = "test2";
	sym2->val = 37564;

	dict = dtopen(&symdisc, Dttree);
	printf("dict = %p\n", dict);
	puts("* insert test *");
	dtinsert(dict, sym);
	printf("dtsize = %d\n", dtsize(dict));
	dtinsert(dict, sym);
	printf("dtsize = %d\n", dtsize(dict));
	dtinsert(dict, sym2);
	printf("dtsize = %d\n", dtsize(dict));

	puts("* refer test *");
	for (i = 0;i < 1000;i++) {
		sp = dtfirst(dict);
	}

	printf("sp = %p\n", sp);
	printf(" %s\n", sp->key);
	printf(" %d\n", sp->val);

	dtclose(dict);

	return 0;
}
