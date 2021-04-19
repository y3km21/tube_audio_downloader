"""pytube sample program"""
from pytube import YouTube
import convert


def download_convert(input_url, dl_file_tmp, output_dir, log_mes):

    yt_tmp = YouTube(input_url)
    cv = convert.Convert(output_dir, log_mes)
    yt_tmp.register_on_complete_callback(cv.convert_mp3)
    log_mes("Running", "Get Stream Status...")
    stream = yt_tmp.streams.get_audio_only()
    log_mes("Running", "Download Start...")
    stream.download(dl_file_tmp)
