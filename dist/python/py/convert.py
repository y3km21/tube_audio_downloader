"""audio converter"""
import re
import os
from pydub import AudioSegment


class Convert:
    """convert class"""

    def __init__(self, outpath_dir, log_mes):
        self.output_path = outpath_dir
        self.log_mes = log_mes

    def convert_mp3(self, inputstream, input_file_path):
        """convert to mp3"""

        self.log_mes("Running", "Download Finish")

        # filetype
        input_file_type = input_file_path.split(sep=".")[-1]
        output_file_type = "mp3"

        # output_dir
        if not os.path.exists(self.output_path):
            os.mkdir(self.output_path)

        # filename
        output_file_name = re.sub(
            '(?<=\\.)[^.]*$', output_file_type, os.path.basename(input_file_path))
        output_file_path = os.path.join(self.output_path, output_file_name)

        # output
        self.log_mes("Running", "Start Conversion...")

        self.log_mes("Running", "OutPutFile : " + output_file_path)
        openfile = AudioSegment.from_file(
            input_file_path, input_file_type)
        openfile.export(output_file_path, output_file_type)
        self.log_mes("Running", "Conversion Finished.")
