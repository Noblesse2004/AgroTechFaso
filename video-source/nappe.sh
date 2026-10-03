#!/bin/sh
# Nappe sonore de la video : deux accords tenus (la mineur, fa majeur) qui
# alternent toutes les dix secondes, en fondu. Synthetisee par ffmpeg : aucun
# droit a gerer. A remplacer par une vraie musique si l'equipe en a une.
cd "$(dirname "$0")"
D=82
A="0.5+0.5*cos(PI*t/10)"
ffmpeg -y -loglevel error -f lavfi -i "aevalsrc='
($A)*(0.30*sin(2*PI*110*t)+0.22*sin(2*PI*164.81*t)+0.16*sin(2*PI*220.6*t)+0.12*sin(2*PI*261.63*t)+0.08*sin(2*PI*329.63*t))
+(1-($A))*(0.30*sin(2*PI*87.31*t)+0.22*sin(2*PI*130.81*t)+0.16*sin(2*PI*174.9*t)+0.12*sin(2*PI*220*t)+0.08*sin(2*PI*261.63*t))
|($A)*(0.30*sin(2*PI*110.4*t)+0.22*sin(2*PI*164.5*t)+0.16*sin(2*PI*220*t)+0.12*sin(2*PI*262*t)+0.08*sin(2*PI*329.2*t))
+(1-($A))*(0.30*sin(2*PI*87.6*t)+0.22*sin(2*PI*130.5*t)+0.16*sin(2*PI*174.61*t)+0.12*sin(2*PI*220.4*t)+0.08*sin(2*PI*261.2*t))
':s=48000:d=$D" \
  -af "tremolo=f=0.15:d=0.25,lowpass=f=900,aecho=0.8:0.7:420|660:0.25|0.18,volume=0.32,afade=t=in:d=3,afade=t=out:st=$((D-4)):d=4,loudnorm=I=-24:TP=-3" \
  -ar 48000 -c:a aac -b:a 128k nappe.m4a
