
/* A Bison parser, made by GNU Bison 2.4.1.  */

/* Skeleton implementation for Bison's Yacc-like parsers in C
   
      Copyright (C) 1984, 1989, 1990, 2000, 2001, 2002, 2003, 2004, 2005, 2006
   Free Software Foundation, Inc.
   
   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
   
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.  */

/* As a special exception, you may create a larger work that contains
   part or all of the Bison parser skeleton and distribute that work
   under terms of your choice, so long as that work isn't itself a
   parser generator using the skeleton or a modified version thereof
   as a parser skeleton.  Alternatively, if you modify or redistribute
   the parser skeleton itself, you may (at your option) remove this
   special exception, which will cause the skeleton and the resulting
   Bison output files to be licensed under the GNU General Public
   License without this special exception.
   
   This special exception was added by the Free Software Foundation in
   version 2.2 of Bison.  */

/* C LALR(1) parser skeleton written by Richard Stallman, by
   simplifying the original so-called "semantic" parser.  */

/* All symbols defined below should begin with ag or YY, to avoid
   infringing on user name space.  This should be done even for local
   variables, as they might otherwise be expanded by user macros.
   There are some unavoidable exceptions within include files to
   define necessary library symbols; they are noted "INFRINGES ON
   USER NAME SPACE" below.  */

/* Identify Bison output.  */
#define YYBISON 1

/* Bison version.  */
#define YYBISON_VERSION "2.4.1"

/* Skeleton name.  */
#define YYSKELETON_NAME "yacc.c"

/* Pure parsers.  */
#define YYPURE 0

/* Push parsers.  */
#define YYPUSH 0

/* Pull parsers.  */
#define YYPULL 1

/* Using locations.  */
#define YYLSP_NEEDED 0



/* Copy the first part of user declarations.  */

/* Line 189 of yacc.c  */
#line 14 "../../lib/graph/parser.y"


#include	"libgraph.h"

#ifdef DMALLOC
#include "dmalloc.h"
#endif

static char		*Port;
static char		In_decl,In_edge_stmt;
static int		Current_class,Agraph_type;
static Agsym_t		*headsubsym;
static Agsym_t		*tailsubsym;
static Agraph_t		*G;
static Agnode_t		*N;
static Agedge_t		*E;
static objstack_t	*SP;
#define GSTACK_SIZE 64
static Agraph_t         *Gstack[GSTACK_SIZE];
static int			GSP;

static void subgraph_warn (void)
{
    agerr (AGWARN, "The use of \"subgraph %s\", line %d, without a body is deprecated.\n",
	G->name, aglinenumber());
    agerr (AGPREV, "This may cause unexpected behavior or crash the program.\n");
    agerr (AGPREV, "Please use a single definition of the subgraph within the context of its parent graph \"%s\"\n", Gstack[GSP-2]->name);
}

static void push_subg(Agraph_t *g)
{
	if (GSP >= GSTACK_SIZE) {
		agerr (AGERR, "Gstack overflow in graph parser\n"); exit(1);
	}
	G = Gstack[GSP++] = g;
}

static Agraph_t *pop_subg(void)
{
	Agraph_t		*g;
	if (GSP == 0) {
		agerr (AGERR, "Gstack underflow in graph parser\n"); exit(1);
	}
	g = Gstack[--GSP];					/* graph being popped off */
	if (GSP > 0) G = Gstack[GSP - 1];	/* current graph */
	else G = 0;
	return g;
}

static objport_t pop_gobj(void)
{
	objport_t	rv;
	rv.obj = pop_subg();
	rv.port = NULL;
	return rv;
}

static void anonname(char* buf)
{
	static int		anon_id = 0;

	sprintf(buf,"_anonymous_%d",anon_id++);
}

static void begin_graph(char *name)
{
	Agraph_t		*g;
	char			buf[SMALLBUF];

	if (!name) {
		anonname(buf);
		name = buf;
    }
	g = AG.parsed_g = agopen(name,Agraph_type);
	Current_class = TAG_GRAPH;
	headsubsym = tailsubsym = NULL;
	push_subg(g);
	In_decl = TRUE;
}

static void end_graph(void)
{
	pop_subg();
}

static Agnode_t *bind_node(char *name)
{
	Agnode_t	*n = agnode(G,name);
	In_decl = FALSE;
	return n;
}

static void anonsubg(void)
{
	char			buf[SMALLBUF];
	Agraph_t			*subg;

	In_decl = FALSE;
	anonname(buf);
	subg = agsubg(G,buf);
	push_subg(subg);
}

#if 0 /* NOT USED */
static int isanonsubg(Agraph_t *g)
{
	return (strncmp("_anonymous_",g->name,11) == 0);
}
#endif

static void begin_edgestmt(objport_t objp)
{
	struct objstack_t	*new_sp;

	new_sp = NEW(objstack_t);
	new_sp->link = SP;
	SP = new_sp;
	SP->list = SP->last = NEW(objlist_t);
	SP->list->data  = objp;
	SP->list->link = NULL;
	SP->in_edge_stmt = In_edge_stmt;
	SP->subg = G;
	agpushproto(G);
	In_edge_stmt = TRUE;
}

static void mid_edgestmt(objport_t objp)
{
	SP->last->link = NEW(objlist_t);
	SP->last = SP->last->link;
	SP->last->data = objp;
	SP->last->link = NULL;
}

static void end_edgestmt(void)
{
	objstack_t	*old_SP;
	objlist_t	*tailptr,*headptr,*freeptr;
	Agraph_t		*t_graph,*h_graph;
	Agnode_t	*t_node,*h_node,*t_first,*h_first;
	Agedge_t	*e;
	char		*tport,*hport;

	for (tailptr = SP->list; tailptr->link; tailptr = tailptr->link) {
		headptr = tailptr->link;
		tport = tailptr->data.port;
		hport = headptr->data.port;
		if (TAG_OF(tailptr->data.obj) == TAG_NODE) {
			t_graph = NULL;
			t_first = (Agnode_t*)(tailptr->data.obj);
		}
		else {
			t_graph = (Agraph_t*)(tailptr->data.obj);
			t_first = agfstnode(t_graph);
		}
		if (TAG_OF(headptr->data.obj) == TAG_NODE) {
			h_graph = NULL;
			h_first = (Agnode_t*)(headptr->data.obj);
		}
		else {
			h_graph = (Agraph_t*)(headptr->data.obj);
			h_first = agfstnode(h_graph);
		}

		for (t_node = t_first; t_node; t_node = t_graph ?
		  agnxtnode(t_graph,t_node) : NULL) {
			for (h_node = h_first; h_node; h_node = h_graph ?
			  agnxtnode(h_graph,h_node) : NULL ) {
				e = agedge(G,t_node,h_node);
				if (e) {
					char	*tp = tport;
					char 	*hp = hport;
					if ((e->tail != e->head) && (e->head == t_node)) {
						/* could happen with an undirected edge */
						char 	*temp;
						temp = tp; tp = hp; hp = temp;
					}
					if (tp && tp[0]) {
						agxset(e,TAILX,tp);
						agstrfree(tp); 
					}
					if (hp && hp[0]) {
						agxset(e,HEADX,hp);
						agstrfree(hp); 
					}
				}
			}
		}
	}
	tailptr = SP->list; 
	while (tailptr) {
		freeptr = tailptr;
		tailptr = tailptr->link;
		if (TAG_OF(freeptr->data.obj) == TAG_NODE)
		free(freeptr);
	}
	if (G != SP->subg) abort();
	agpopproto(G);
	In_edge_stmt = SP->in_edge_stmt;
	old_SP = SP;
	SP = SP->link;
	In_decl = FALSE;
	free(old_SP);
	Current_class = TAG_GRAPH;
}

#if 0 /* NOT USED */
static Agraph_t *parent_of(Agraph_t *g)
{
	Agraph_t		*rv;
	rv = agusergraph(agfstin(g->meta_node->graph,g->meta_node)->tail);
	return rv;
}
#endif

static void attr_set(char *name, char *value)
{
	Agsym_t		*ap = NULL;
	char		*defval = "";

	if (In_decl && (G->root == G)) defval = value;
	switch (Current_class) {
		case TAG_NODE:
			ap = agfindattr(G->proto->n,name);
			if (ap == NULL)
				ap = agnodeattr(AG.parsed_g,name,defval);
            else if (ap->fixed && In_decl)
              return;
			agxset(N,ap->index,value);
			break;
		case TAG_EDGE:
			ap = agfindattr(G->proto->e,name);
			if (ap == NULL)
				ap = agedgeattr(AG.parsed_g,name,defval);
            else if (ap->fixed && In_decl && (G->root == G))
              return;
			agxset(E,ap->index,value);
			break;
		case 0:		/* default */
		case TAG_GRAPH:
			ap = agfindattr(G,name);
			if (ap == NULL) 
				ap = agraphattr(AG.parsed_g,name,defval);
            else if (ap->fixed && In_decl)
              return;
			agxset(G,ap->index,value);
			break;
	}
}

/* concat:
 */
static char*
concat (char* s1, char* s2)
{
  char*  s;
  char   buf[BUFSIZ];
  char*  sym;
  int    len = strlen(s1) + strlen(s2) + 1;

  if (len <= BUFSIZ) sym = buf;
  else sym = (char*)malloc(len);
  strcpy(sym,s1);
  strcat(sym,s2);
  s = agstrdup (sym);
  if (sym != buf) free (sym);
  return s;
}

/* concat3:
 */
static char*
concat3 (char* s1, char* s2, char*s3)
{
  char*  s;
  char   buf[BUFSIZ];
  char*  sym;
  int    len = strlen(s1) + strlen(s2) + strlen(s3) + 1;

  if (len <= BUFSIZ) sym = buf;
  else sym = (char*)malloc(len);
  strcpy(sym,s1);
  strcat(sym,s2);
  strcat(sym,s3);
  s = agstrdup (sym);
  if (sym != buf) free (sym);
  return s;
}



/* Line 189 of yacc.c  */
#line 365 "y.tab.c"

/* Enabling traces.  */
#ifndef YYDEBUG
# define YYDEBUG 0
#endif

/* Enabling verbose error messages.  */
#ifdef YYERROR_VERBOSE
# undef YYERROR_VERBOSE
# define YYERROR_VERBOSE 1
#else
# define YYERROR_VERBOSE 0
#endif

/* Enabling the token table.  */
#ifndef YYTOKEN_TABLE
# define YYTOKEN_TABLE 0
#endif


/* Tokens.  */
#ifndef YYTOKENTYPE
# define YYTOKENTYPE
   /* Put the tokens into the symbol table, so that GDB and other debuggers
      know about them.  */
   enum agtokentype {
     T_graph = 258,
     T_digraph = 259,
     T_strict = 260,
     T_node = 261,
     T_edge = 262,
     T_edgeop = 263,
     T_symbol = 264,
     T_qsymbol = 265,
     T_subgraph = 266
   };
#endif
/* Tokens.  */
#define T_graph 258
#define T_digraph 259
#define T_strict 260
#define T_node 261
#define T_edge 262
#define T_edgeop 263
#define T_symbol 264
#define T_qsymbol 265
#define T_subgraph 266




#if ! defined YYSTYPE && ! defined YYSTYPE_IS_DECLARED
typedef union YYSTYPE
{

/* Line 214 of yacc.c  */
#line 305 "../../lib/graph/parser.y"

			int					i;
			char				*str;
			struct objport_t	obj;
			struct Agnode_t		*n;



/* Line 214 of yacc.c  */
#line 432 "y.tab.c"
} YYSTYPE;
# define YYSTYPE_IS_TRIVIAL 1
# define agstype YYSTYPE /* obsolescent; will be withdrawn */
# define YYSTYPE_IS_DECLARED 1
#endif


/* Copy the second part of user declarations.  */


/* Line 264 of yacc.c  */
#line 444 "y.tab.c"

#ifdef short
# undef short
#endif

#ifdef YYTYPE_UINT8
typedef YYTYPE_UINT8 agtype_uint8;
#else
typedef unsigned char agtype_uint8;
#endif

#ifdef YYTYPE_INT8
typedef YYTYPE_INT8 agtype_int8;
#elif (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
typedef signed char agtype_int8;
#else
typedef short int agtype_int8;
#endif

#ifdef YYTYPE_UINT16
typedef YYTYPE_UINT16 agtype_uint16;
#else
typedef unsigned short int agtype_uint16;
#endif

#ifdef YYTYPE_INT16
typedef YYTYPE_INT16 agtype_int16;
#else
typedef short int agtype_int16;
#endif

#ifndef YYSIZE_T
# ifdef __SIZE_TYPE__
#  define YYSIZE_T __SIZE_TYPE__
# elif defined size_t
#  define YYSIZE_T size_t
# elif ! defined YYSIZE_T && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
#  include <stddef.h> /* INFRINGES ON USER NAME SPACE */
#  define YYSIZE_T size_t
# else
#  define YYSIZE_T unsigned int
# endif
#endif

#define YYSIZE_MAXIMUM ((YYSIZE_T) -1)

#ifndef YY_
# if YYENABLE_NLS
#  if ENABLE_NLS
#   include <libintl.h> /* INFRINGES ON USER NAME SPACE */
#   define YY_(msgid) dgettext ("bison-runtime", msgid)
#  endif
# endif
# ifndef YY_
#  define YY_(msgid) msgid
# endif
#endif

/* Suppress unused-variable warnings by "using" E.  */
#if ! defined lint || defined __GNUC__
# define YYUSE(e) ((void) (e))
#else
# define YYUSE(e) /* empty */
#endif

/* Identity function, used to suppress warnings about constant conditions.  */
#ifndef lint
# define YYID(n) (n)
#else
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static int
YYID (int agi)
#else
static int
YYID (agi)
    int agi;
#endif
{
  return agi;
}
#endif

#if ! defined agoverflow || YYERROR_VERBOSE

/* The parser invokes alloca or malloc; define the necessary symbols.  */

# ifdef YYSTACK_USE_ALLOCA
#  if YYSTACK_USE_ALLOCA
#   ifdef __GNUC__
#    define YYSTACK_ALLOC __builtin_alloca
#   elif defined __BUILTIN_VA_ARG_INCR
#    include <alloca.h> /* INFRINGES ON USER NAME SPACE */
#   elif defined _AIX
#    define YYSTACK_ALLOC __alloca
#   elif defined _MSC_VER
#    include <malloc.h> /* INFRINGES ON USER NAME SPACE */
#    define alloca _alloca
#   else
#    define YYSTACK_ALLOC alloca
#    if ! defined _ALLOCA_H && ! defined _STDLIB_H && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
#     include <stdlib.h> /* INFRINGES ON USER NAME SPACE */
#     ifndef _STDLIB_H
#      define _STDLIB_H 1
#     endif
#    endif
#   endif
#  endif
# endif

# ifdef YYSTACK_ALLOC
   /* Pacify GCC's `empty if-body' warning.  */
#  define YYSTACK_FREE(Ptr) do { /* empty */; } while (YYID (0))
#  ifndef YYSTACK_ALLOC_MAXIMUM
    /* The OS might guarantee only one guard page at the bottom of the stack,
       and a page size can be as small as 4096 bytes.  So we cannot safely
       invoke alloca (N) if N exceeds 4096.  Use a slightly smaller number
       to allow for a few compiler-allocated temporary stack slots.  */
#   define YYSTACK_ALLOC_MAXIMUM 4032 /* reasonable circa 2006 */
#  endif
# else
#  define YYSTACK_ALLOC YYMALLOC
#  define YYSTACK_FREE YYFREE
#  ifndef YYSTACK_ALLOC_MAXIMUM
#   define YYSTACK_ALLOC_MAXIMUM YYSIZE_MAXIMUM
#  endif
#  if (defined __cplusplus && ! defined _STDLIB_H \
       && ! ((defined YYMALLOC || defined malloc) \
	     && (defined YYFREE || defined free)))
#   include <stdlib.h> /* INFRINGES ON USER NAME SPACE */
#   ifndef _STDLIB_H
#    define _STDLIB_H 1
#   endif
#  endif
#  ifndef YYMALLOC
#   define YYMALLOC malloc
#   if ! defined malloc && ! defined _STDLIB_H && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
void *malloc (YYSIZE_T); /* INFRINGES ON USER NAME SPACE */
#   endif
#  endif
#  ifndef YYFREE
#   define YYFREE free
#   if ! defined free && ! defined _STDLIB_H && (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
void free (void *); /* INFRINGES ON USER NAME SPACE */
#   endif
#  endif
# endif
#endif /* ! defined agoverflow || YYERROR_VERBOSE */


#if (! defined agoverflow \
     && (! defined __cplusplus \
	 || (defined YYSTYPE_IS_TRIVIAL && YYSTYPE_IS_TRIVIAL)))

/* A type that is properly aligned for any stack member.  */
union agalloc
{
  agtype_int16 agss_alloc;
  YYSTYPE agvs_alloc;
};

/* The size of the maximum gap between one aligned stack and the next.  */
# define YYSTACK_GAP_MAXIMUM (sizeof (union agalloc) - 1)

/* The size of an array large to enough to hold all stacks, each with
   N elements.  */
# define YYSTACK_BYTES(N) \
     ((N) * (sizeof (agtype_int16) + sizeof (YYSTYPE)) \
      + YYSTACK_GAP_MAXIMUM)

/* Copy COUNT objects from FROM to TO.  The source and destination do
   not overlap.  */
# ifndef YYCOPY
#  if defined __GNUC__ && 1 < __GNUC__
#   define YYCOPY(To, From, Count) \
      __builtin_memcpy (To, From, (Count) * sizeof (*(From)))
#  else
#   define YYCOPY(To, From, Count)		\
      do					\
	{					\
	  YYSIZE_T agi;				\
	  for (agi = 0; agi < (Count); agi++)	\
	    (To)[agi] = (From)[agi];		\
	}					\
      while (YYID (0))
#  endif
# endif

/* Relocate STACK from its old location to the new one.  The
   local variables YYSIZE and YYSTACKSIZE give the old and new number of
   elements in the stack, and YYPTR gives the new location of the
   stack.  Advance YYPTR to a properly aligned location for the next
   stack.  */
# define YYSTACK_RELOCATE(Stack_alloc, Stack)				\
    do									\
      {									\
	YYSIZE_T agnewbytes;						\
	YYCOPY (&agptr->Stack_alloc, Stack, agsize);			\
	Stack = &agptr->Stack_alloc;					\
	agnewbytes = agstacksize * sizeof (*Stack) + YYSTACK_GAP_MAXIMUM; \
	agptr += agnewbytes / sizeof (*agptr);				\
      }									\
    while (YYID (0))

#endif

/* YYFINAL -- State number of the termination state.  */
#define YYFINAL  9
/* YYLAST -- Last index in YYTABLE.  */
#define YYLAST   80

/* YYNTOKENS -- Number of terminals.  */
#define YYNTOKENS  21
/* YYNNTS -- Number of nonterminals.  */
#define YYNNTS  37
/* YYNRULES -- Number of rules.  */
#define YYNRULES  68
/* YYNRULES -- Number of states.  */
#define YYNSTATES  90

/* YYTRANSLATE(YYLEX) -- Bison symbol number corresponding to YYLEX.  */
#define YYUNDEFTOK  2
#define YYMAXUTOK   266

#define YYTRANSLATE(YYX)						\
  ((unsigned int) (YYX) <= YYMAXUTOK ? agtranslate[YYX] : YYUNDEFTOK)

/* YYTRANSLATE[YYLEX] -- Bison symbol number corresponding to YYLEX.  */
static const agtype_uint8 agtranslate[] =
{
       0,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,    20,    14,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,    19,    18,
       2,    17,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,    15,     2,    16,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,    12,     2,    13,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     2,     2,     2,     2,
       2,     2,     2,     2,     2,     2,     1,     2,     3,     4,
       5,     6,     7,     8,     9,    10,    11
};

#if YYDEBUG
/* YYPRHS[YYN] -- Index of the first RHS symbol of rule number YYN in
   YYRHS.  */
static const agtype_uint8 agprhs[] =
{
       0,     0,     3,     4,    11,    13,    14,    16,    17,    19,
      22,    24,    27,    29,    31,    33,    37,    38,    39,    41,
      45,    48,    49,    51,    55,    57,    59,    61,    62,    64,
      67,    69,    72,    74,    76,    78,    80,    82,    85,    87,
      90,    92,    93,    96,   101,   102,   106,   107,   108,   114,
     115,   116,   122,   125,   126,   131,   134,   135,   140,   145,
     146,   152,   153,   158,   160,   163,   165,   167,   169
};

/* YYRHS -- A `-1'-separated list of the rules' RHS.  */
static const agtype_int8 agrhs[] =
{
      22,     0,    -1,    -1,    25,    24,    23,    12,    34,    13,
      -1,     1,    -1,    -1,    56,    -1,    -1,     3,    -1,     5,
       3,    -1,     4,    -1,     5,     4,    -1,     3,    -1,     6,
      -1,     7,    -1,    33,    28,    27,    -1,    -1,    -1,    14,
      -1,    15,    27,    16,    -1,    30,    29,    -1,    -1,    30,
      -1,    56,    17,    56,    -1,    32,    -1,    56,    -1,    35,
      -1,    -1,    36,    -1,    35,    36,    -1,    37,    -1,    37,
      18,    -1,     1,    -1,    42,    -1,    44,    -1,    38,    -1,
      52,    -1,    26,    29,    -1,    32,    -1,    40,    41,    -1,
      56,    -1,    -1,    19,    56,    -1,    19,    56,    19,    56,
      -1,    -1,    39,    43,    31,    -1,    -1,    -1,    39,    45,
      49,    46,    31,    -1,    -1,    -1,    52,    47,    49,    48,
      31,    -1,     8,    39,    -1,    -1,     8,    39,    50,    49,
      -1,     8,    52,    -1,    -1,     8,    52,    51,    49,    -1,
      55,    12,    34,    13,    -1,    -1,    11,    12,    53,    34,
      13,    -1,    -1,    12,    54,    34,    13,    -1,    55,    -1,
      11,    56,    -1,     9,    -1,    57,    -1,    10,    -1,    57,
      20,    10,    -1
};

/* YYRLINE[YYN] -- source line where rule number YYN was defined.  */
static const agtype_uint16 agrline[] =
{
       0,   323,   323,   322,   326,   333,   336,   336,   339,   341,
     343,   345,   349,   351,   353,   357,   358,   361,   362,   365,
     368,   369,   372,   375,   379,   380,   384,   385,   388,   389,
     392,   393,   394,   397,   398,   399,   400,   403,   405,   409,
     419,   422,   423,   424,   428,   427,   434,   436,   433,   441,
     443,   440,   449,   451,   450,   453,   456,   455,   461,   462,
     462,   463,   463,   464,   467,   477,   478,   481,   482
};
#endif

#if YYDEBUG || YYERROR_VERBOSE || YYTOKEN_TABLE
/* YYTNAME[SYMBOL-NUM] -- String name of the symbol SYMBOL-NUM.
   First, the terminals, then, starting at YYNTOKENS, nonterminals.  */
static const char *const agtname[] =
{
  "$end", "error", "$undefined", "T_graph", "T_digraph", "T_strict",
  "T_node", "T_edge", "T_edgeop", "T_symbol", "T_qsymbol", "T_subgraph",
  "'{'", "'}'", "','", "'['", "']'", "'='", "';'", "':'", "'+'", "$accept",
  "file", "$@1", "optgraphname", "graph_type", "attr_class",
  "inside_attr_list", "optcomma", "attr_list", "rec_attr_list",
  "opt_attr_list", "attr_set", "iattr_set", "stmt_list", "stmt_list1",
  "stmt", "stmt1", "attr_stmt", "node_id", "node_name", "node_port",
  "node_stmt", "$@2", "edge_stmt", "$@3", "$@4", "$@5", "$@6", "edgeRHS",
  "$@7", "$@8", "subg_stmt", "$@9", "$@10", "subg_hdr", "symbol",
  "qsymbol", 0
};
#endif

# ifdef YYPRINT
/* YYTOKNUM[YYLEX-NUM] -- Internal token number corresponding to
   token YYLEX-NUM.  */
static const agtype_uint16 agtoknum[] =
{
       0,   256,   257,   258,   259,   260,   261,   262,   263,   264,
     265,   266,   123,   125,    44,    91,    93,    61,    59,    58,
      43
};
# endif

/* YYR1[YYN] -- Symbol number of symbol that rule YYN derives.  */
static const agtype_uint8 agr1[] =
{
       0,    21,    23,    22,    22,    22,    24,    24,    25,    25,
      25,    25,    26,    26,    26,    27,    27,    28,    28,    29,
      30,    30,    31,    32,    33,    33,    34,    34,    35,    35,
      36,    36,    36,    37,    37,    37,    37,    38,    38,    39,
      40,    41,    41,    41,    43,    42,    45,    46,    44,    47,
      48,    44,    49,    50,    49,    49,    51,    49,    52,    53,
      52,    54,    52,    52,    55,    56,    56,    57,    57
};

/* YYR2[YYN] -- Number of symbols composing right hand side of rule YYN.  */
static const agtype_uint8 agr2[] =
{
       0,     2,     0,     6,     1,     0,     1,     0,     1,     2,
       1,     2,     1,     1,     1,     3,     0,     0,     1,     3,
       2,     0,     1,     3,     1,     1,     1,     0,     1,     2,
       1,     2,     1,     1,     1,     1,     1,     2,     1,     2,
       1,     0,     2,     4,     0,     3,     0,     0,     5,     0,
       0,     5,     2,     0,     4,     2,     0,     4,     4,     0,
       5,     0,     4,     1,     2,     1,     1,     1,     3
};

/* YYDEFACT[STATE-NAME] -- Default rule to reduce with in state
   STATE-NUM when YYTABLE doesn't specify something else to do.  Zero
   means the default is an error.  */
static const agtype_uint8 agdefact[] =
{
       0,     4,     8,    10,     0,     0,     7,     9,    11,     1,
      65,    67,     2,     6,    66,     0,     0,     0,    68,    32,
      12,    13,    14,     0,    61,     0,    38,     0,     0,    28,
      30,    35,    44,    41,    33,    34,    36,    63,    40,    59,
      64,     0,    16,    37,     3,    29,    31,    21,     0,     0,
      39,     0,     0,     0,     0,     0,     0,    24,    17,    25,
      22,    45,     0,    47,    42,    50,     0,    23,     0,    62,
      19,    18,    16,    20,    52,    55,    40,    21,     0,    21,
      58,    60,    15,     0,     0,    48,    43,    51,    54,    57
};

/* YYDEFGOTO[NTERM-NUM].  */
static const agtype_int8 agdefgoto[] =
{
      -1,     5,    15,    12,     6,    25,    56,    72,    43,    60,
      61,    26,    58,    27,    28,    29,    30,    31,    32,    33,
      50,    34,    47,    35,    48,    77,    51,    79,    63,    83,
      84,    36,    54,    41,    37,    38,    14
};

/* YYPACT[STATE-NUM] -- Index in YYTABLE of the portion describing
   STATE-NUM.  */
#define YYPACT_NINF -68
static const agtype_int8 agpact[] =
{
       4,   -68,   -68,   -68,    27,     6,    44,   -68,   -68,   -68,
     -68,   -68,   -68,   -68,    -9,     8,    25,    12,   -68,   -68,
     -68,   -68,   -68,    29,   -68,    22,   -68,    31,    39,   -68,
      37,   -68,    49,    40,   -68,   -68,    50,    48,    45,   -68,
     -68,    12,    44,   -68,   -68,   -68,   -68,   -68,    53,    44,
     -68,    53,    12,    44,    12,    51,    47,   -68,    54,    45,
      22,   -68,    17,   -68,    46,   -68,    56,   -68,    57,   -68,
     -68,   -68,    44,   -68,    59,    63,   -68,   -68,    44,   -68,
     -68,   -68,   -68,    53,    53,   -68,   -68,   -68,   -68,   -68
};

/* YYPGOTO[NTERM-NUM].  */
static const agtype_int8 agpgoto[] =
{
     -68,   -68,   -68,   -68,   -68,   -68,     1,   -68,    14,   -68,
     -67,   -40,   -68,   -38,   -68,    52,   -68,   -68,    13,   -68,
     -68,   -68,   -68,   -68,   -68,   -68,   -68,   -68,   -50,   -68,
     -68,    15,   -68,   -68,   -68,    -6,   -68
};

/* YYTABLE[YYPACT[STATE-NUM]].  What to do in state STATE-NUM.  If
   positive, shift that token.  If negative, reduce the rule which
   number is the opposite.  If zero, do what YYDEFACT says.
   If YYTABLE_NINF, syntax error.  */
#define YYTABLE_NINF -57
static const agtype_int8 agtable[] =
{
      13,    65,    57,    55,    -5,     1,     9,     2,     3,     4,
      85,    16,    87,    19,    66,    20,    68,    40,    21,    22,
      17,    10,    11,    23,    24,   -27,    10,    11,    23,    24,
       7,     8,    57,    88,    89,    18,    59,    42,    10,    11,
      19,    39,    20,    64,    44,    21,    22,    67,    10,    11,
      23,    24,   -26,    10,    11,    46,    76,   -46,   -49,    49,
      52,    62,    53,    70,    69,    78,    59,   -53,    71,    80,
      81,   -56,    86,    82,    73,    74,     0,    75,     0,     0,
      45
};

static const agtype_int8 agcheck[] =
{
       6,    51,    42,    41,     0,     1,     0,     3,     4,     5,
      77,    20,    79,     1,    52,     3,    54,    23,     6,     7,
      12,     9,    10,    11,    12,    13,     9,    10,    11,    12,
       3,     4,    72,    83,    84,    10,    42,    15,     9,    10,
       1,    12,     3,    49,    13,     6,     7,    53,     9,    10,
      11,    12,    13,     9,    10,    18,    62,     8,     8,    19,
      12,     8,    17,    16,    13,    19,    72,     8,    14,    13,
      13,     8,    78,    72,    60,    62,    -1,    62,    -1,    -1,
      28
};

/* YYSTOS[STATE-NUM] -- The (internal number of the) accessing
   symbol of state STATE-NUM.  */
static const agtype_uint8 agstos[] =
{
       0,     1,     3,     4,     5,    22,    25,     3,     4,     0,
       9,    10,    24,    56,    57,    23,    20,    12,    10,     1,
       3,     6,     7,    11,    12,    26,    32,    34,    35,    36,
      37,    38,    39,    40,    42,    44,    52,    55,    56,    12,
      56,    54,    15,    29,    13,    36,    18,    43,    45,    19,
      41,    47,    12,    17,    53,    34,    27,    32,    33,    56,
      30,    31,     8,    49,    56,    49,    34,    56,    34,    13,
      16,    14,    28,    29,    39,    52,    56,    46,    19,    48,
      13,    13,    27,    50,    51,    31,    56,    31,    49,    49
};

#define agerrok		(agerrstatus = 0)
#define agclearin	(agchar = YYEMPTY)
#define YYEMPTY		(-2)
#define YYEOF		0

#define YYACCEPT	goto agacceptlab
#define YYABORT		goto agabortlab
#define YYERROR		goto agerrorlab


/* Like YYERROR except do call agerror.  This remains here temporarily
   to ease the transition to the new meaning of YYERROR, for GCC.
   Once GCC version 2 has supplanted version 1, this can go.  */

#define YYFAIL		goto agerrlab

#define YYRECOVERING()  (!!agerrstatus)

#define YYBACKUP(Token, Value)					\
do								\
  if (agchar == YYEMPTY && aglen == 1)				\
    {								\
      agchar = (Token);						\
      aglval = (Value);						\
      agtoken = YYTRANSLATE (agchar);				\
      YYPOPSTACK (1);						\
      goto agbackup;						\
    }								\
  else								\
    {								\
      agerror (YY_("syntax error: cannot back up")); \
      YYERROR;							\
    }								\
while (YYID (0))


#define YYTERROR	1
#define YYERRCODE	256


/* YYLLOC_DEFAULT -- Set CURRENT to span from RHS[1] to RHS[N].
   If N is 0, then set CURRENT to the empty location which ends
   the previous symbol: RHS[0] (always defined).  */

#define YYRHSLOC(Rhs, K) ((Rhs)[K])
#ifndef YYLLOC_DEFAULT
# define YYLLOC_DEFAULT(Current, Rhs, N)				\
    do									\
      if (YYID (N))                                                    \
	{								\
	  (Current).first_line   = YYRHSLOC (Rhs, 1).first_line;	\
	  (Current).first_column = YYRHSLOC (Rhs, 1).first_column;	\
	  (Current).last_line    = YYRHSLOC (Rhs, N).last_line;		\
	  (Current).last_column  = YYRHSLOC (Rhs, N).last_column;	\
	}								\
      else								\
	{								\
	  (Current).first_line   = (Current).last_line   =		\
	    YYRHSLOC (Rhs, 0).last_line;				\
	  (Current).first_column = (Current).last_column =		\
	    YYRHSLOC (Rhs, 0).last_column;				\
	}								\
    while (YYID (0))
#endif


/* YY_LOCATION_PRINT -- Print the location on the stream.
   This macro was not mandated originally: define only if we know
   we won't break user code: when these are the locations we know.  */

#ifndef YY_LOCATION_PRINT
# if YYLTYPE_IS_TRIVIAL
#  define YY_LOCATION_PRINT(File, Loc)			\
     fprintf (File, "%d.%d-%d.%d",			\
	      (Loc).first_line, (Loc).first_column,	\
	      (Loc).last_line,  (Loc).last_column)
# else
#  define YY_LOCATION_PRINT(File, Loc) ((void) 0)
# endif
#endif


/* YYLEX -- calling `aglex' with the right arguments.  */

#ifdef YYLEX_PARAM
# define YYLEX aglex (YYLEX_PARAM)
#else
# define YYLEX aglex ()
#endif

/* Enable debugging if requested.  */
#if YYDEBUG

# ifndef YYFPRINTF
#  include <stdio.h> /* INFRINGES ON USER NAME SPACE */
#  define YYFPRINTF fprintf
# endif

# define YYDPRINTF(Args)			\
do {						\
  if (agdebug)					\
    YYFPRINTF Args;				\
} while (YYID (0))

# define YY_SYMBOL_PRINT(Title, Type, Value, Location)			  \
do {									  \
  if (agdebug)								  \
    {									  \
      YYFPRINTF (stderr, "%s ", Title);					  \
      ag_symbol_print (stderr,						  \
		  Type, Value); \
      YYFPRINTF (stderr, "\n");						  \
    }									  \
} while (YYID (0))


/*--------------------------------.
| Print this symbol on YYOUTPUT.  |
`--------------------------------*/

/*ARGSUSED*/
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
ag_symbol_value_print (FILE *agoutput, int agtype, YYSTYPE const * const agvaluep)
#else
static void
ag_symbol_value_print (agoutput, agtype, agvaluep)
    FILE *agoutput;
    int agtype;
    YYSTYPE const * const agvaluep;
#endif
{
  if (!agvaluep)
    return;
# ifdef YYPRINT
  if (agtype < YYNTOKENS)
    YYPRINT (agoutput, agtoknum[agtype], *agvaluep);
# else
  YYUSE (agoutput);
# endif
  switch (agtype)
    {
      default:
	break;
    }
}


/*--------------------------------.
| Print this symbol on YYOUTPUT.  |
`--------------------------------*/

#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
ag_symbol_print (FILE *agoutput, int agtype, YYSTYPE const * const agvaluep)
#else
static void
ag_symbol_print (agoutput, agtype, agvaluep)
    FILE *agoutput;
    int agtype;
    YYSTYPE const * const agvaluep;
#endif
{
  if (agtype < YYNTOKENS)
    YYFPRINTF (agoutput, "token %s (", agtname[agtype]);
  else
    YYFPRINTF (agoutput, "nterm %s (", agtname[agtype]);

  ag_symbol_value_print (agoutput, agtype, agvaluep);
  YYFPRINTF (agoutput, ")");
}

/*------------------------------------------------------------------.
| ag_stack_print -- Print the state stack from its BOTTOM up to its |
| TOP (included).                                                   |
`------------------------------------------------------------------*/

#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
ag_stack_print (agtype_int16 *agbottom, agtype_int16 *agtop)
#else
static void
ag_stack_print (agbottom, agtop)
    agtype_int16 *agbottom;
    agtype_int16 *agtop;
#endif
{
  YYFPRINTF (stderr, "Stack now");
  for (; agbottom <= agtop; agbottom++)
    {
      int agbot = *agbottom;
      YYFPRINTF (stderr, " %d", agbot);
    }
  YYFPRINTF (stderr, "\n");
}

# define YY_STACK_PRINT(Bottom, Top)				\
do {								\
  if (agdebug)							\
    ag_stack_print ((Bottom), (Top));				\
} while (YYID (0))


/*------------------------------------------------.
| Report that the YYRULE is going to be reduced.  |
`------------------------------------------------*/

#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
ag_reduce_print (YYSTYPE *agvsp, int agrule)
#else
static void
ag_reduce_print (agvsp, agrule)
    YYSTYPE *agvsp;
    int agrule;
#endif
{
  int agnrhs = agr2[agrule];
  int agi;
  unsigned long int aglno = agrline[agrule];
  YYFPRINTF (stderr, "Reducing stack by rule %d (line %lu):\n",
	     agrule - 1, aglno);
  /* The symbols being reduced.  */
  for (agi = 0; agi < agnrhs; agi++)
    {
      YYFPRINTF (stderr, "   $%d = ", agi + 1);
      ag_symbol_print (stderr, agrhs[agprhs[agrule] + agi],
		       &(agvsp[(agi + 1) - (agnrhs)])
		       		       );
      YYFPRINTF (stderr, "\n");
    }
}

# define YY_REDUCE_PRINT(Rule)		\
do {					\
  if (agdebug)				\
    ag_reduce_print (agvsp, Rule); \
} while (YYID (0))

/* Nonzero means print parse trace.  It is left uninitialized so that
   multiple parsers can coexist.  */
int agdebug;
#else /* !YYDEBUG */
# define YYDPRINTF(Args)
# define YY_SYMBOL_PRINT(Title, Type, Value, Location)
# define YY_STACK_PRINT(Bottom, Top)
# define YY_REDUCE_PRINT(Rule)
#endif /* !YYDEBUG */


/* YYINITDEPTH -- initial size of the parser's stacks.  */
#ifndef	YYINITDEPTH
# define YYINITDEPTH 200
#endif

/* YYMAXDEPTH -- maximum size the stacks can grow to (effective only
   if the built-in stack extension method is used).

   Do not make this value too large; the results are undefined if
   YYSTACK_ALLOC_MAXIMUM < YYSTACK_BYTES (YYMAXDEPTH)
   evaluated with infinite-precision integer arithmetic.  */

#ifndef YYMAXDEPTH
# define YYMAXDEPTH 10000
#endif



#if YYERROR_VERBOSE

# ifndef agstrlen
#  if defined __GLIBC__ && defined _STRING_H
#   define agstrlen strlen
#  else
/* Return the length of YYSTR.  */
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static YYSIZE_T
agstrlen (const char *agstr)
#else
static YYSIZE_T
agstrlen (agstr)
    const char *agstr;
#endif
{
  YYSIZE_T aglen;
  for (aglen = 0; agstr[aglen]; aglen++)
    continue;
  return aglen;
}
#  endif
# endif

# ifndef agstpcpy
#  if defined __GLIBC__ && defined _STRING_H && defined _GNU_SOURCE
#   define agstpcpy stpcpy
#  else
/* Copy YYSRC to YYDEST, returning the address of the terminating '\0' in
   YYDEST.  */
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static char *
agstpcpy (char *agdest, const char *agsrc)
#else
static char *
agstpcpy (agdest, agsrc)
    char *agdest;
    const char *agsrc;
#endif
{
  char *agd = agdest;
  const char *ags = agsrc;

  while ((*agd++ = *ags++) != '\0')
    continue;

  return agd - 1;
}
#  endif
# endif

# ifndef agtnamerr
/* Copy to YYRES the contents of YYSTR after stripping away unnecessary
   quotes and backslashes, so that it's suitable for agerror.  The
   heuristic is that double-quoting is unnecessary unless the string
   contains an apostrophe, a comma, or backslash (other than
   backslash-backslash).  YYSTR is taken from agtname.  If YYRES is
   null, do not copy; instead, return the length of what the result
   would have been.  */
static YYSIZE_T
agtnamerr (char *agres, const char *agstr)
{
  if (*agstr == '"')
    {
      YYSIZE_T agn = 0;
      char const *agp = agstr;

      for (;;)
	switch (*++agp)
	  {
	  case '\'':
	  case ',':
	    goto do_not_strip_quotes;

	  case '\\':
	    if (*++agp != '\\')
	      goto do_not_strip_quotes;
	    /* Fall through.  */
	  default:
	    if (agres)
	      agres[agn] = *agp;
	    agn++;
	    break;

	  case '"':
	    if (agres)
	      agres[agn] = '\0';
	    return agn;
	  }
    do_not_strip_quotes: ;
    }

  if (! agres)
    return agstrlen (agstr);

  return agstpcpy (agres, agstr) - agres;
}
# endif

/* Copy into YYRESULT an error message about the unexpected token
   YYCHAR while in state YYSTATE.  Return the number of bytes copied,
   including the terminating null byte.  If YYRESULT is null, do not
   copy anything; just return the number of bytes that would be
   copied.  As a special case, return 0 if an ordinary "syntax error"
   message will do.  Return YYSIZE_MAXIMUM if overflow occurs during
   size calculation.  */
static YYSIZE_T
agsyntax_error (char *agresult, int agstate, int agchar)
{
  int agn = agpact[agstate];

  if (! (YYPACT_NINF < agn && agn <= YYLAST))
    return 0;
  else
    {
      int agtype = YYTRANSLATE (agchar);
      YYSIZE_T agsize0 = agtnamerr (0, agtname[agtype]);
      YYSIZE_T agsize = agsize0;
      YYSIZE_T agsize1;
      int agsize_overflow = 0;
      enum { YYERROR_VERBOSE_ARGS_MAXIMUM = 5 };
      char const *agarg[YYERROR_VERBOSE_ARGS_MAXIMUM];
      int agx;

# if 0
      /* This is so xgettext sees the translatable formats that are
	 constructed on the fly.  */
      YY_("syntax error, unexpected %s");
      YY_("syntax error, unexpected %s, expecting %s");
      YY_("syntax error, unexpected %s, expecting %s or %s");
      YY_("syntax error, unexpected %s, expecting %s or %s or %s");
      YY_("syntax error, unexpected %s, expecting %s or %s or %s or %s");
# endif
      char *agfmt;
      char const *agf;
      static char const agunexpected[] = "syntax error, unexpected %s";
      static char const agexpecting[] = ", expecting %s";
      static char const agor[] = " or %s";
      char agformat[sizeof agunexpected
		    + sizeof agexpecting - 1
		    + ((YYERROR_VERBOSE_ARGS_MAXIMUM - 2)
		       * (sizeof agor - 1))];
      char const *agprefix = agexpecting;

      /* Start YYX at -YYN if negative to avoid negative indexes in
	 YYCHECK.  */
      int agxbegin = agn < 0 ? -agn : 0;

      /* Stay within bounds of both agcheck and agtname.  */
      int agchecklim = YYLAST - agn + 1;
      int agxend = agchecklim < YYNTOKENS ? agchecklim : YYNTOKENS;
      int agcount = 1;

      agarg[0] = agtname[agtype];
      agfmt = agstpcpy (agformat, agunexpected);

      for (agx = agxbegin; agx < agxend; ++agx)
	if (agcheck[agx + agn] == agx && agx != YYTERROR)
	  {
	    if (agcount == YYERROR_VERBOSE_ARGS_MAXIMUM)
	      {
		agcount = 1;
		agsize = agsize0;
		agformat[sizeof agunexpected - 1] = '\0';
		break;
	      }
	    agarg[agcount++] = agtname[agx];
	    agsize1 = agsize + agtnamerr (0, agtname[agx]);
	    agsize_overflow |= (agsize1 < agsize);
	    agsize = agsize1;
	    agfmt = agstpcpy (agfmt, agprefix);
	    agprefix = agor;
	  }

      agf = YY_(agformat);
      agsize1 = agsize + agstrlen (agf);
      agsize_overflow |= (agsize1 < agsize);
      agsize = agsize1;

      if (agsize_overflow)
	return YYSIZE_MAXIMUM;

      if (agresult)
	{
	  /* Avoid sprintf, as that infringes on the user's name space.
	     Don't have undefined behavior even if the translation
	     produced a string with the wrong number of "%s"s.  */
	  char *agp = agresult;
	  int agi = 0;
	  while ((*agp = *agf) != '\0')
	    {
	      if (*agp == '%' && agf[1] == 's' && agi < agcount)
		{
		  agp += agtnamerr (agp, agarg[agi++]);
		  agf += 2;
		}
	      else
		{
		  agp++;
		  agf++;
		}
	    }
	}
      return agsize;
    }
}
#endif /* YYERROR_VERBOSE */


/*-----------------------------------------------.
| Release the memory associated to this symbol.  |
`-----------------------------------------------*/

/*ARGSUSED*/
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
static void
agdestruct (const char *agmsg, int agtype, YYSTYPE *agvaluep)
#else
static void
agdestruct (agmsg, agtype, agvaluep)
    const char *agmsg;
    int agtype;
    YYSTYPE *agvaluep;
#endif
{
  YYUSE (agvaluep);

  if (!agmsg)
    agmsg = "Deleting";
  YY_SYMBOL_PRINT (agmsg, agtype, agvaluep, aglocationp);

  switch (agtype)
    {

      default:
	break;
    }
}

/* Prevent warnings from -Wmissing-prototypes.  */
#ifdef YYPARSE_PARAM
#if defined __STDC__ || defined __cplusplus
int agparse (void *YYPARSE_PARAM);
#else
int agparse ();
#endif
#else /* ! YYPARSE_PARAM */
#if defined __STDC__ || defined __cplusplus
int agparse (void);
#else
int agparse ();
#endif
#endif /* ! YYPARSE_PARAM */


/* The lookahead symbol.  */
int agchar;

/* The semantic value of the lookahead symbol.  */
YYSTYPE aglval;

/* Number of syntax errors so far.  */
int agnerrs;



/*-------------------------.
| agparse or agpush_parse.  |
`-------------------------*/

#ifdef YYPARSE_PARAM
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
int
agparse (void *YYPARSE_PARAM)
#else
int
agparse (YYPARSE_PARAM)
    void *YYPARSE_PARAM;
#endif
#else /* ! YYPARSE_PARAM */
#if (defined __STDC__ || defined __C99__FUNC__ \
     || defined __cplusplus || defined _MSC_VER)
int
agparse (void)
#else
int
agparse ()

#endif
#endif
{


    int agstate;
    /* Number of tokens to shift before error messages enabled.  */
    int agerrstatus;

    /* The stacks and their tools:
       `agss': related to states.
       `agvs': related to semantic values.

       Refer to the stacks thru separate pointers, to allow agoverflow
       to reallocate them elsewhere.  */

    /* The state stack.  */
    agtype_int16 agssa[YYINITDEPTH];
    agtype_int16 *agss;
    agtype_int16 *agssp;

    /* The semantic value stack.  */
    YYSTYPE agvsa[YYINITDEPTH];
    YYSTYPE *agvs;
    YYSTYPE *agvsp;

    YYSIZE_T agstacksize;

  int agn;
  int agresult;
  /* Lookahead token as an internal (translated) token number.  */
  int agtoken;
  /* The variables used to return semantic value and location from the
     action routines.  */
  YYSTYPE agval;

#if YYERROR_VERBOSE
  /* Buffer for error messages, and its allocated size.  */
  char agmsgbuf[128];
  char *agmsg = agmsgbuf;
  YYSIZE_T agmsg_alloc = sizeof agmsgbuf;
#endif

#define YYPOPSTACK(N)   (agvsp -= (N), agssp -= (N))

  /* The number of symbols on the RHS of the reduced rule.
     Keep to zero when no symbol should be popped.  */
  int aglen = 0;

  agtoken = 0;
  agss = agssa;
  agvs = agvsa;
  agstacksize = YYINITDEPTH;

  YYDPRINTF ((stderr, "Starting parse\n"));

  agstate = 0;
  agerrstatus = 0;
  agnerrs = 0;
  agchar = YYEMPTY; /* Cause a token to be read.  */

  /* Initialize stack pointers.
     Waste one element of value and location stack
     so that they stay on the same level as the state stack.
     The wasted elements are never initialized.  */
  agssp = agss;
  agvsp = agvs;

  goto agsetstate;

/*------------------------------------------------------------.
| agnewstate -- Push a new state, which is found in agstate.  |
`------------------------------------------------------------*/
 agnewstate:
  /* In all cases, when you get here, the value and location stacks
     have just been pushed.  So pushing a state here evens the stacks.  */
  agssp++;

 agsetstate:
  *agssp = agstate;

  if (agss + agstacksize - 1 <= agssp)
    {
      /* Get the current used size of the three stacks, in elements.  */
      YYSIZE_T agsize = agssp - agss + 1;

#ifdef agoverflow
      {
	/* Give user a chance to reallocate the stack.  Use copies of
	   these so that the &'s don't force the real ones into
	   memory.  */
	YYSTYPE *agvs1 = agvs;
	agtype_int16 *agss1 = agss;

	/* Each stack pointer address is followed by the size of the
	   data in use in that stack, in bytes.  This used to be a
	   conditional around just the two extra args, but that might
	   be undefined if agoverflow is a macro.  */
	agoverflow (YY_("memory exhausted"),
		    &agss1, agsize * sizeof (*agssp),
		    &agvs1, agsize * sizeof (*agvsp),
		    &agstacksize);

	agss = agss1;
	agvs = agvs1;
      }
#else /* no agoverflow */
# ifndef YYSTACK_RELOCATE
      goto agexhaustedlab;
# else
      /* Extend the stack our own way.  */
      if (YYMAXDEPTH <= agstacksize)
	goto agexhaustedlab;
      agstacksize *= 2;
      if (YYMAXDEPTH < agstacksize)
	agstacksize = YYMAXDEPTH;

      {
	agtype_int16 *agss1 = agss;
	union agalloc *agptr =
	  (union agalloc *) YYSTACK_ALLOC (YYSTACK_BYTES (agstacksize));
	if (! agptr)
	  goto agexhaustedlab;
	YYSTACK_RELOCATE (agss_alloc, agss);
	YYSTACK_RELOCATE (agvs_alloc, agvs);
#  undef YYSTACK_RELOCATE
	if (agss1 != agssa)
	  YYSTACK_FREE (agss1);
      }
# endif
#endif /* no agoverflow */

      agssp = agss + agsize - 1;
      agvsp = agvs + agsize - 1;

      YYDPRINTF ((stderr, "Stack size increased to %lu\n",
		  (unsigned long int) agstacksize));

      if (agss + agstacksize - 1 <= agssp)
	YYABORT;
    }

  YYDPRINTF ((stderr, "Entering state %d\n", agstate));

  if (agstate == YYFINAL)
    YYACCEPT;

  goto agbackup;

/*-----------.
| agbackup.  |
`-----------*/
agbackup:

  /* Do appropriate processing given the current state.  Read a
     lookahead token if we need one and don't already have one.  */

  /* First try to decide what to do without reference to lookahead token.  */
  agn = agpact[agstate];
  if (agn == YYPACT_NINF)
    goto agdefault;

  /* Not known => get a lookahead token if don't already have one.  */

  /* YYCHAR is either YYEMPTY or YYEOF or a valid lookahead symbol.  */
  if (agchar == YYEMPTY)
    {
      YYDPRINTF ((stderr, "Reading a token: "));
      agchar = YYLEX;
    }

  if (agchar <= YYEOF)
    {
      agchar = agtoken = YYEOF;
      YYDPRINTF ((stderr, "Now at end of input.\n"));
    }
  else
    {
      agtoken = YYTRANSLATE (agchar);
      YY_SYMBOL_PRINT ("Next token is", agtoken, &aglval, &aglloc);
    }

  /* If the proper action on seeing token YYTOKEN is to reduce or to
     detect an error, take that action.  */
  agn += agtoken;
  if (agn < 0 || YYLAST < agn || agcheck[agn] != agtoken)
    goto agdefault;
  agn = agtable[agn];
  if (agn <= 0)
    {
      if (agn == 0 || agn == YYTABLE_NINF)
	goto agerrlab;
      agn = -agn;
      goto agreduce;
    }

  /* Count tokens shifted since error; after three, turn off error
     status.  */
  if (agerrstatus)
    agerrstatus--;

  /* Shift the lookahead token.  */
  YY_SYMBOL_PRINT ("Shifting", agtoken, &aglval, &aglloc);

  /* Discard the shifted token.  */
  agchar = YYEMPTY;

  agstate = agn;
  *++agvsp = aglval;

  goto agnewstate;


/*-----------------------------------------------------------.
| agdefault -- do the default action for the current state.  |
`-----------------------------------------------------------*/
agdefault:
  agn = agdefact[agstate];
  if (agn == 0)
    goto agerrlab;
  goto agreduce;


/*-----------------------------.
| agreduce -- Do a reduction.  |
`-----------------------------*/
agreduce:
  /* agn is the number of a rule to reduce with.  */
  aglen = agr2[agn];

  /* If YYLEN is nonzero, implement the default value of the action:
     `$$ = $1'.

     Otherwise, the following line sets YYVAL to garbage.
     This behavior is undocumented and Bison
     users should not rely upon it.  Assigning to YYVAL
     unconditionally makes the parser a bit smaller, and it avoids a
     GCC warning that YYVAL may be used uninitialized.  */
  agval = agvsp[1-aglen];


  YY_REDUCE_PRINT (agn);
  switch (agn)
    {
        case 2:

/* Line 1455 of yacc.c  */
#line 323 "../../lib/graph/parser.y"
    {begin_graph((agvsp[(2) - (2)].str)); agstrfree((agvsp[(2) - (2)].str));}
    break;

  case 3:

/* Line 1455 of yacc.c  */
#line 325 "../../lib/graph/parser.y"
    {AG.accepting_state = TRUE; end_graph();}
    break;

  case 4:

/* Line 1455 of yacc.c  */
#line 327 "../../lib/graph/parser.y"
    {
					if (AG.parsed_g)
						agclose(AG.parsed_g);
					AG.parsed_g = NULL;
					/*exit(1);*/
				}
    break;

  case 5:

/* Line 1455 of yacc.c  */
#line 333 "../../lib/graph/parser.y"
    {AG.parsed_g = NULL;}
    break;

  case 6:

/* Line 1455 of yacc.c  */
#line 336 "../../lib/graph/parser.y"
    {(agval.str)=(agvsp[(1) - (1)].str);}
    break;

  case 7:

/* Line 1455 of yacc.c  */
#line 336 "../../lib/graph/parser.y"
    {(agval.str)=0;}
    break;

  case 8:

/* Line 1455 of yacc.c  */
#line 340 "../../lib/graph/parser.y"
    {Agraph_type = AGRAPH; AG.edge_op = "--";}
    break;

  case 9:

/* Line 1455 of yacc.c  */
#line 342 "../../lib/graph/parser.y"
    {Agraph_type = AGRAPHSTRICT; AG.edge_op = "--";}
    break;

  case 10:

/* Line 1455 of yacc.c  */
#line 344 "../../lib/graph/parser.y"
    {Agraph_type = AGDIGRAPH; AG.edge_op = "->";}
    break;

  case 11:

/* Line 1455 of yacc.c  */
#line 346 "../../lib/graph/parser.y"
    {Agraph_type = AGDIGRAPHSTRICT; AG.edge_op = "->";}
    break;

  case 12:

/* Line 1455 of yacc.c  */
#line 350 "../../lib/graph/parser.y"
    {Current_class = TAG_GRAPH;}
    break;

  case 13:

/* Line 1455 of yacc.c  */
#line 352 "../../lib/graph/parser.y"
    {Current_class = TAG_NODE; N = G->proto->n;}
    break;

  case 14:

/* Line 1455 of yacc.c  */
#line 354 "../../lib/graph/parser.y"
    {Current_class = TAG_EDGE; E = G->proto->e;}
    break;

  case 23:

/* Line 1455 of yacc.c  */
#line 376 "../../lib/graph/parser.y"
    {attr_set((agvsp[(1) - (3)].str),(agvsp[(3) - (3)].str)); agstrfree((agvsp[(1) - (3)].str)); agstrfree((agvsp[(3) - (3)].str));}
    break;

  case 25:

/* Line 1455 of yacc.c  */
#line 381 "../../lib/graph/parser.y"
    {attr_set((agvsp[(1) - (1)].str),"true"); agstrfree((agvsp[(1) - (1)].str)); }
    break;

  case 32:

/* Line 1455 of yacc.c  */
#line 394 "../../lib/graph/parser.y"
    {agerror("syntax error, statement skipped");}
    break;

  case 36:

/* Line 1455 of yacc.c  */
#line 400 "../../lib/graph/parser.y"
    {}
    break;

  case 37:

/* Line 1455 of yacc.c  */
#line 404 "../../lib/graph/parser.y"
    {Current_class = TAG_GRAPH; /* reset */}
    break;

  case 38:

/* Line 1455 of yacc.c  */
#line 406 "../../lib/graph/parser.y"
    {Current_class = TAG_GRAPH;}
    break;

  case 39:

/* Line 1455 of yacc.c  */
#line 410 "../../lib/graph/parser.y"
    {
					objport_t		rv;
					rv.obj = (agvsp[(1) - (2)].n);
					rv.port = Port;
					Port = NULL;
					(agval.obj) = rv;
				}
    break;

  case 40:

/* Line 1455 of yacc.c  */
#line 419 "../../lib/graph/parser.y"
    {(agval.n) = bind_node((agvsp[(1) - (1)].str)); agstrfree((agvsp[(1) - (1)].str));}
    break;

  case 42:

/* Line 1455 of yacc.c  */
#line 423 "../../lib/graph/parser.y"
    { Port=(agvsp[(2) - (2)].str);}
    break;

  case 43:

/* Line 1455 of yacc.c  */
#line 424 "../../lib/graph/parser.y"
    {Port=concat3((agvsp[(2) - (4)].str),":",(agvsp[(4) - (4)].str));agstrfree((agvsp[(2) - (4)].str)); agstrfree((agvsp[(4) - (4)].str));}
    break;

  case 44:

/* Line 1455 of yacc.c  */
#line 428 "../../lib/graph/parser.y"
    {Current_class = TAG_NODE; N = (Agnode_t*)((agvsp[(1) - (1)].obj).obj);}
    break;

  case 45:

/* Line 1455 of yacc.c  */
#line 430 "../../lib/graph/parser.y"
    {agstrfree((agvsp[(1) - (3)].obj).port);Current_class = TAG_GRAPH; /* reset */}
    break;

  case 46:

/* Line 1455 of yacc.c  */
#line 434 "../../lib/graph/parser.y"
    {begin_edgestmt((agvsp[(1) - (1)].obj));}
    break;

  case 47:

/* Line 1455 of yacc.c  */
#line 436 "../../lib/graph/parser.y"
    { E = SP->subg->proto->e;
				  Current_class = TAG_EDGE; }
    break;

  case 48:

/* Line 1455 of yacc.c  */
#line 439 "../../lib/graph/parser.y"
    {end_edgestmt();}
    break;

  case 49:

/* Line 1455 of yacc.c  */
#line 441 "../../lib/graph/parser.y"
    {begin_edgestmt((agvsp[(1) - (1)].obj));}
    break;

  case 50:

/* Line 1455 of yacc.c  */
#line 443 "../../lib/graph/parser.y"
    { E = SP->subg->proto->e;
				  Current_class = TAG_EDGE; }
    break;

  case 51:

/* Line 1455 of yacc.c  */
#line 446 "../../lib/graph/parser.y"
    {end_edgestmt();}
    break;

  case 52:

/* Line 1455 of yacc.c  */
#line 449 "../../lib/graph/parser.y"
    {mid_edgestmt((agvsp[(2) - (2)].obj));}
    break;

  case 53:

/* Line 1455 of yacc.c  */
#line 451 "../../lib/graph/parser.y"
    {mid_edgestmt((agvsp[(2) - (2)].obj));}
    break;

  case 55:

/* Line 1455 of yacc.c  */
#line 454 "../../lib/graph/parser.y"
    {mid_edgestmt((agvsp[(2) - (2)].obj));}
    break;

  case 56:

/* Line 1455 of yacc.c  */
#line 456 "../../lib/graph/parser.y"
    {mid_edgestmt((agvsp[(2) - (2)].obj));}
    break;

  case 58:

/* Line 1455 of yacc.c  */
#line 461 "../../lib/graph/parser.y"
    {(agval.obj) = pop_gobj();}
    break;

  case 59:

/* Line 1455 of yacc.c  */
#line 462 "../../lib/graph/parser.y"
    { anonsubg(); }
    break;

  case 60:

/* Line 1455 of yacc.c  */
#line 462 "../../lib/graph/parser.y"
    {(agval.obj) = pop_gobj();}
    break;

  case 61:

/* Line 1455 of yacc.c  */
#line 463 "../../lib/graph/parser.y"
    { anonsubg(); }
    break;

  case 62:

/* Line 1455 of yacc.c  */
#line 463 "../../lib/graph/parser.y"
    {(agval.obj) = pop_gobj();}
    break;

  case 63:

/* Line 1455 of yacc.c  */
#line 464 "../../lib/graph/parser.y"
    {subgraph_warn(); (agval.obj) = pop_gobj();}
    break;

  case 64:

/* Line 1455 of yacc.c  */
#line 468 "../../lib/graph/parser.y"
    { Agraph_t	 *subg;
				if ((subg = agfindsubg(AG.parsed_g,(agvsp[(2) - (2)].str)))) aginsert(G,subg);
				else subg = agsubg(G,(agvsp[(2) - (2)].str)); 
				push_subg(subg);
				In_decl = FALSE;
				agstrfree((agvsp[(2) - (2)].str));
				}
    break;

  case 65:

/* Line 1455 of yacc.c  */
#line 477 "../../lib/graph/parser.y"
    {(agval.str) = (agvsp[(1) - (1)].str); }
    break;

  case 66:

/* Line 1455 of yacc.c  */
#line 478 "../../lib/graph/parser.y"
    {(agval.str) = (agvsp[(1) - (1)].str); }
    break;

  case 67:

/* Line 1455 of yacc.c  */
#line 481 "../../lib/graph/parser.y"
    {(agval.str) = (agvsp[(1) - (1)].str); }
    break;

  case 68:

/* Line 1455 of yacc.c  */
#line 482 "../../lib/graph/parser.y"
    {(agval.str) = concat((agvsp[(1) - (3)].str),(agvsp[(3) - (3)].str)); agstrfree((agvsp[(1) - (3)].str)); agstrfree((agvsp[(3) - (3)].str));}
    break;



/* Line 1455 of yacc.c  */
#line 2060 "y.tab.c"
      default: break;
    }
  YY_SYMBOL_PRINT ("-> $$ =", agr1[agn], &agval, &agloc);

  YYPOPSTACK (aglen);
  aglen = 0;
  YY_STACK_PRINT (agss, agssp);

  *++agvsp = agval;

  /* Now `shift' the result of the reduction.  Determine what state
     that goes to, based on the state we popped back to and the rule
     number reduced by.  */

  agn = agr1[agn];

  agstate = agpgoto[agn - YYNTOKENS] + *agssp;
  if (0 <= agstate && agstate <= YYLAST && agcheck[agstate] == *agssp)
    agstate = agtable[agstate];
  else
    agstate = agdefgoto[agn - YYNTOKENS];

  goto agnewstate;


/*------------------------------------.
| agerrlab -- here on detecting error |
`------------------------------------*/
agerrlab:
  /* If not already recovering from an error, report this error.  */
  if (!agerrstatus)
    {
      ++agnerrs;
#if ! YYERROR_VERBOSE
      agerror (YY_("syntax error"));
#else
      {
	YYSIZE_T agsize = agsyntax_error (0, agstate, agchar);
	if (agmsg_alloc < agsize && agmsg_alloc < YYSTACK_ALLOC_MAXIMUM)
	  {
	    YYSIZE_T agalloc = 2 * agsize;
	    if (! (agsize <= agalloc && agalloc <= YYSTACK_ALLOC_MAXIMUM))
	      agalloc = YYSTACK_ALLOC_MAXIMUM;
	    if (agmsg != agmsgbuf)
	      YYSTACK_FREE (agmsg);
	    agmsg = (char *) YYSTACK_ALLOC (agalloc);
	    if (agmsg)
	      agmsg_alloc = agalloc;
	    else
	      {
		agmsg = agmsgbuf;
		agmsg_alloc = sizeof agmsgbuf;
	      }
	  }

	if (0 < agsize && agsize <= agmsg_alloc)
	  {
	    (void) agsyntax_error (agmsg, agstate, agchar);
	    agerror (agmsg);
	  }
	else
	  {
	    agerror (YY_("syntax error"));
	    if (agsize != 0)
	      goto agexhaustedlab;
	  }
      }
#endif
    }



  if (agerrstatus == 3)
    {
      /* If just tried and failed to reuse lookahead token after an
	 error, discard it.  */

      if (agchar <= YYEOF)
	{
	  /* Return failure if at end of input.  */
	  if (agchar == YYEOF)
	    YYABORT;
	}
      else
	{
	  agdestruct ("Error: discarding",
		      agtoken, &aglval);
	  agchar = YYEMPTY;
	}
    }

  /* Else will try to reuse lookahead token after shifting the error
     token.  */
  goto agerrlab1;


/*---------------------------------------------------.
| agerrorlab -- error raised explicitly by YYERROR.  |
`---------------------------------------------------*/
agerrorlab:

  /* Pacify compilers like GCC when the user code never invokes
     YYERROR and the label agerrorlab therefore never appears in user
     code.  */
  if (/*CONSTCOND*/ 0)
     goto agerrorlab;

  /* Do not reclaim the symbols of the rule which action triggered
     this YYERROR.  */
  YYPOPSTACK (aglen);
  aglen = 0;
  YY_STACK_PRINT (agss, agssp);
  agstate = *agssp;
  goto agerrlab1;


/*-------------------------------------------------------------.
| agerrlab1 -- common code for both syntax error and YYERROR.  |
`-------------------------------------------------------------*/
agerrlab1:
  agerrstatus = 3;	/* Each real token shifted decrements this.  */

  for (;;)
    {
      agn = agpact[agstate];
      if (agn != YYPACT_NINF)
	{
	  agn += YYTERROR;
	  if (0 <= agn && agn <= YYLAST && agcheck[agn] == YYTERROR)
	    {
	      agn = agtable[agn];
	      if (0 < agn)
		break;
	    }
	}

      /* Pop the current state because it cannot handle the error token.  */
      if (agssp == agss)
	YYABORT;


      agdestruct ("Error: popping",
		  agstos[agstate], agvsp);
      YYPOPSTACK (1);
      agstate = *agssp;
      YY_STACK_PRINT (agss, agssp);
    }

  *++agvsp = aglval;


  /* Shift the error token.  */
  YY_SYMBOL_PRINT ("Shifting", agstos[agn], agvsp, aglsp);

  agstate = agn;
  goto agnewstate;


/*-------------------------------------.
| agacceptlab -- YYACCEPT comes here.  |
`-------------------------------------*/
agacceptlab:
  agresult = 0;
  goto agreturn;

/*-----------------------------------.
| agabortlab -- YYABORT comes here.  |
`-----------------------------------*/
agabortlab:
  agresult = 1;
  goto agreturn;

#if !defined(agoverflow) || YYERROR_VERBOSE
/*-------------------------------------------------.
| agexhaustedlab -- memory exhaustion comes here.  |
`-------------------------------------------------*/
agexhaustedlab:
  agerror (YY_("memory exhausted"));
  agresult = 2;
  /* Fall through.  */
#endif

agreturn:
  if (agchar != YYEMPTY)
     agdestruct ("Cleanup: discarding lookahead",
		 agtoken, &aglval);
  /* Do not reclaim the symbols of the rule which action triggered
     this YYABORT or YYACCEPT.  */
  YYPOPSTACK (aglen);
  YY_STACK_PRINT (agss, agssp);
  while (agssp != agss)
    {
      agdestruct ("Cleanup: popping",
		  agstos[*agssp], agvsp);
      YYPOPSTACK (1);
    }
#ifndef agoverflow
  if (agss != agssa)
    YYSTACK_FREE (agss);
#endif
#if YYERROR_VERBOSE
  if (agmsg != agmsgbuf)
    YYSTACK_FREE (agmsg);
#endif
  /* Make sure YYID is used.  */
  return YYID (agresult);
}



/* Line 1675 of yacc.c  */
#line 484 "../../lib/graph/parser.y"

#ifdef UNUSED
/* grammar allowing port variants */
/* at present, these are not used, so we remove them from the grammar */
/* NOTE: If used, these should be rewritten to take into account the */
/* move away from using ':' in the string and that symbols come from */
/* agstrdup and need to be freed. */
node_port	:	/* empty */
		|	port_location 
		|	port_angle 			/* undocumented */
		|	port_angle port_location 	/* undocumented */
		|	port_location port_angle 	/* undocumented */
		;

port_location	:	':' symbol {strcat(Port,":"); strcat(Port,$2);}
		|	':' '(' symbol {Symbol = strdup($3);} ',' symbol ')'
				{	char buf[SMALLBUF];
					sprintf(buf,":(%s,%s)",Symbol,$6);
					strcat(Port,buf); free(Symbol);
				}
		;

port_angle	:	'@' symbol
				{	char buf[SMALLBUF];
					sprintf(buf,"@%s",$2);
					strcat(Port,buf);
				}
		;

#endif

