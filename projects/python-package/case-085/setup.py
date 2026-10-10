from setuptools import Extension, setup

setup(ext_modules=[Extension("case085", sources=["src/case085.c"])])
