__author__ = 'steveh'
from j5apps import app
from default_app import DefaultApp
from flask import Response, make_response
import glob
from os.path import join, basename, dirname

class j5builds(DefaultApp):

    def __init__ (self,*args,**kwargs):
        title = "J5 Builds"
        template = "j5builds.html"
        config = kwargs.get("config",None)
        self.location = config.get("j5builds","location") if config else None
        #print(self.location, glob.glob(self.location))
        self.files = dict([(basename(f),File(f)) for f in glob.glob(join(self.location,"*"))])

        super(j5builds,self).__init__(title, template)

    def get_app(self, context=dict()):
        context["files"] = self.files
        return super(j5builds,self).get_app(context)


    def download_file(self, filename):
        file = self.files[filename]
        data = open(file.fullpath,"rb")
        response = make_response(data.read())
        response.headers['Content-Description'] = 'File Transfer'
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['Content-Type'] = 'application/octet-stream'
        response.headers["Content-Disposition"] = "attachment; filename=%s" % file.filename
        return response

class File(object):

    filename = ""
    fullpath = ""
    caption = ""
    href = ""

    def __init__ (self,fullpath,fqdn="http://localhost:5000/app/j5builds/download"):
        self.fullpath = fullpath
        self.caption = basename(fullpath)
        self.filename = basename(fullpath)
        self.href = fqdn + "/" + self.filename
