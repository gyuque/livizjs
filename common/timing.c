/* $Id: timing.c,v 1.9 2011/01/25 16:30:48 ellson Exp $ $Revision: 1.9 $ */
/* vim:set shiftwidth=4 ts=8: */

/*************************************************************************
 * Copyright (c) 2011 AT&T Intellectual Property 
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v10.html
 *
 * Contributors: See CVS logs. Details at http://www.graphviz.org/
 *************************************************************************/

#ifndef WIN32

#include        <unistd.h>
#include	<sys/types.h>
#include	<sys/times.h>
#include	<sys/param.h>



#ifndef HZ
#define HZ 60
#endif
typedef struct tms mytime_t;
#define GET_TIME(S) times(&(S))
#define DIFF_IN_SECS(S,T) ((S.tms_utime + S.tms_stime - T.tms_utime - T.tms_stime)/(double)HZ)

#else

#include	<time.h>
#include "render.h"
#include    "utils.h"

typedef clock_t mytime_t;
#define GET_TIME(S) S = clock()
#define DIFF_IN_SECS(S,T) ((S - T) / (double)CLOCKS_PER_SEC)

#endif


#define FAKE_TIMER

static mytime_t T;

void start_timer(void)
{
#ifdef FAKE_TIMER

#else
    GET_TIME(T);
#endif
}

double elapsed_sec(void)
{
#ifdef FAKE_TIMER
	return 0.0;
#else
    mytime_t S;
    double rv;

    GET_TIME(S);
    rv = DIFF_IN_SECS(S, T);
    return rv;
#endif
}

