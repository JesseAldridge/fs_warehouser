from setuptools import setup, find_packages
import sys, os

version = '1.0.4'

setup(name='fs_warehouser',
      version=version,
      description="Filesystem based data warehousing framework",
      long_description="""""",
      classifiers=[],
      keywords='data-warehouse',
      author='Jesse Aldridge',
      author_email='JesseAldridge@gmail.com',
      url='https://github.com/JesseAldridge/fs_warehouser',
      license='MIT',
      packages=['fs_warehouser'],
      include_package_data=True,
      zip_safe=True,
      install_requires=[
          # -*- Extra requirements: -*-
      ]
      )
