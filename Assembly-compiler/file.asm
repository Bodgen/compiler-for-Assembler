DATA	segment
	A1	db	255
	A2	db	0101111111b
	A3	db	'string'
A11 db -129
A21 db '+'
pop 1111b
	B1	dw	0110b
	B2	dw	1FD2h
	B3	dw	-45
B11 dw 0ffffh
	C1	dd	31265
	C2	dd	0BF11h
	C22 dd  fafbfcfdh
	C3	dd	1F23h
C11 dd -8
C4  dd  23f
DATA

MCR1 MACRO A
    mov A,3212
    mov A,0fah
    mov A,15
ENDM

MCR MACRO
	pop dx

ENDM

MCR2 MACRO MEM2
    mov ax,-1
  and bx,MEM2
    mov cl,-1
ENDM

CODE	segment
	VAR db  0001b
D11 dw 1234h
pop 0111b
pop dx
jl clc
	jl	GO2
jl GO1
jl lap1
GO1:
jl GO1
	MCR1 bx
	mov bx,80CAh
	cmp	ds:[bx+si+5],bh
	cmp VAR[bp+si-2],bh
	div eax
	div ax
cmp cs:VAR[bp+si-2],bh
    MCR
    MCR11
	cmp gs:VAR[bx+si+5],bh
	cmp ds:A2[bx+si+5],bh
	and ax,1111b
	jl EXIT
GO2:
MCR2 B11[bp+si+22]
MCR2 gs:D11[bp+si+22]
pop sp
	mov al,255
	div ds:A3[bp+di-10]
div ss:A3[bp+di+2]
or	ds:B2[bx+si+4],0B3h
	bt	bx,cx
	clc
	and ah,es:A1[bx+si+2]
and si,D11[bx+si+5]
and si,ds:D11[bx+si+5]
and si,cs:D11[bx+si+5]
	jl GO1
or	ds:B2[bx+si+4],-0Bh
	clc
	cmp ds:B1[bx+si+3],dx
MCR1 ax
EXIT:
CODE
END