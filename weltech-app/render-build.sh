#!/usr/bin/env bash
set -o errexit

# ติดตั้ง library พื้นฐานสำหรับ OpenCV บน Linux
apt-get update && apt-get install -y libgl1-mesa-glx

# อัปเกรด pip และลง library ตาม requirements.txt
pip install --upgrade pip
pip install -r requirements.txt