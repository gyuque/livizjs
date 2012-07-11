CC = clang
EM = emcc
CFLAGS = -I.
OBJS = dtclose.c  dtdisc.c    dtextract.c dtflatten.c dthash.c dtlist.c \
	  dtmethod.c  dtopen.c    dtsize.c    dtstrhash.c dttree.c \
	  dttreeset.c dtrestore.c dtview.c    dtwalk.c

testrun: libcdt-em.bc
	$(CC) -o testrun $(CFLAGS) testrun-cdt.c libcdt-em.bc
	$(EM) -o testrun.js $(CFLAGS) testrun-cdt.c libcdt-em.bc

libcdt-em.bc:
	$(EM) -o libcdt-em.bc $(CFLAGS) $(OBJS)
	
.PHONY: clean
clean:
	rm -f testrun
	rm -f *.bc
