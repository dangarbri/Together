#!/usr/bin/python
import sys

fp = open("/home/dangarbri/together/storage/pythonoutput.txt", 'w')
fp.write(sys.argv[0])
fp.write("\n")
fp.write(sys.argv[1])
fp.write("\n")
fp.write(sys.argv[2])
fp.write("\n")
fp.close()
