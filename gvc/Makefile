EM = emcc
CFLAGS = -DHAVE_CONFIG_H -I. -I.. -I../common -I../pathplan -I../cdt -I../graph
OBJS = gvc.c gvconfig.c gvcontext.c gvdevice.c gvlayout.c \
	 gvevent.c gvjobs.c gvplugin.c gvrender.c gvusershape.c \
	 gvloadimage.c gvtextlayout.c

libgvc-em.bc:
	$(EM) -o libgvc-em.bc $(CFLAGS) $(OBJS)
	
.PHONY: clean
clean:
	rm -f *.bc
