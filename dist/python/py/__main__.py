"""main"""

import sys
import json
import os
import pathlib
import shutil
import certifi
import download
import platform

#
# Log Mes
#
def log_message(status, message):
    d = {"status": status, "message": message}
    jsond = json.dumps(d, ensure_ascii=False)
    print(jsond)


#
# Arg
#
argstr = sys.stdin.readline()
argobj = json.loads(argstr)
outputDir = argobj['args'][0]
youtubeUrl = argobj['args'][1]

#
# python root
#
pyroot = pathlib.Path(__file__).parent.parent
# log_message("Running", str(pathlib.Path(__file__).parent.parent))

#
# ENV INIT
#
oldPATH = os.environ['PATH']
exModuleBin = os.path.join(pyroot, "bin")
platform_name = platform.system()

if(platform_name == "Darwin"):
    os.environ['PATH'] = exModuleBin + ":" + oldPATH
elif (platform_name == "Windows"):
    os.environ['PATH'] = exModuleBin + ";" + oldPATH

ssl_cert_file = certifi.where()
os.environ['SSL_CERT_FILE'] = ssl_cert_file
downloadFileTmp = os.path.join(pyroot, "tmp")


#
# Try Download
#
try:
    download.download_convert(
        youtubeUrl, downloadFileTmp, outputDir, log_message)
finally:
    if os.path.isdir(downloadFileTmp):
        shutil.rmtree(downloadFileTmp)

#
#log_message("Running", shutil.which("ffmpeg"))
#log_message("Running", shutil.which("ffprobe"))
#
