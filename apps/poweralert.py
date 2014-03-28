__author__ = 'Steve'
from default_app import DefaultApp
from feedparser import parse

class poweralert(DefaultApp):

    def __init__ (self, *args, **kwargs):
        title = "Power Alert"
        template = "poweralert.html"
        self.feed = parse("http://poweralert.co.za/poweralert5/rss.xml" )
        super(poweralert,self).__init__(title, template)

    def get_app(self, context=dict()):
        context["feed"] = "<br>".join(["<b>%s</b>: <a href='%s'>%s</a>" % (feed["title"].split("PowerAlert")[0].strip(),feed['link'],feed["description"]) for feed in self.feed["entries"]])
        return super(poweralert,self).get_app(context)