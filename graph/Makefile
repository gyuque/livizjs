CC = clang
EM = emcc
CFLAGS = -I. -I../cdt -I../gvc -I../common -I../pathplan
OBJS = agxbuf.c attribs.c edge.c \
	graph.c graphio.c lexer.c node.c parser.c refstr.c trie.c

testrun: libgraph-em.bc
	$(CC) -o testrun $(CFLAGS) testrun-graph.c libgraph-em.bc ../cdt/libcdt-em.bc
	$(EM) -o testrun.js $(CFLAGS) testrun-graph.c libgraph-em.bc ../cdt/libcdt-em.bc

libgraph-em.bc:
	$(EM) -o libgraph-em.bc $(CFLAGS) $(OBJS)
	
.PHONY: clean
clean:
	rm -f testrun
	rm -f *.bc
