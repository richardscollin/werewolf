#!/bin/bash
set -xe
ids='alpha-wolf;angel;apprentice-seer;baker;beholder;bodyguard;cupid;cursed;diseased;doppelganger;dream-wolf;drunk;executioner;golem;hoodlum;hunter;idiot;lone-wolf;lycan;mason;minion;old-hag;pacifist;poison-wolf;seer;sorcerer;spellcaster;tanner;tough-guy;vampire;villager;werewolf-hunter;werewolf;whore;wolf-cub;zombie-wolf'
inkscape --export-id="$ids" \
    --export-id-only \
    --export-area-page \
    --export-type=png \
    --export-background-opacity="0.0" \
    --export-png-color-mode=RGBA_8 \
    werewolf-icons.svg
