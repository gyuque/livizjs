CC = clang
EM = emcc
CFLAGS = -I. 
OBJS = cvt.c inpoly.c route.c shortest.c \
	 solvers.c triang.c util.c visibility.c


libpathplan-em.bc:
	$(EM) -o libpathplan-em.bc $(CFLAGS) $(OBJS)
	
.PHONY: clean
clean:
	rm -f *.bc
