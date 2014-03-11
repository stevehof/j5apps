__author__ = 'Steve'
from App import DefaultApp
from feedparser import parse

class poweralert(DefaultApp):

    def __init__ (self):
        title = "Power Alert"
        template = "poweralert.html"
        self.feed = parse("http://poweralert.co.za/poweralert5/rss.xml" )
        super(poweralert,self).__init__(title, template)

    def get_app(self, context=dict()):
        context["feed"] = "<br>".join(["<b>%s</b>: %s" % (feed["title"].split("PowerAlert")[0].strip(),feed["description"]) for feed in self.feed["entries"]])
        return super(poweralert,self).get_app(context)