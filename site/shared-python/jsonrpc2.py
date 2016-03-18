import sys, json
import StringIO
import traceback as tb

class report_class:
  def error(self,s): sys.stderr.write(s)
  # success
  def success(self,result=None):
    if result is not None: 
      print json.dumps(result)
  # fail
  def traceback(self):
    exc_type, exc_value, exc_traceback = sys.exc_info() 
    return tb.format_exception(exc_type, exc_value, exc_traceback)
  def fail(self,infile,code=1):
    self.error("Error in {}.".format(infile))
    self.error(json.dumps(self.traceback(),indent=2))
    print
    sys.exit(code)
  
class rpc_report_class(report_class):
  rpc_id = None
  stdout0 = None
  stdout1 = StringIO.StringIO()
  stderr0 = None
  stderr1 = StringIO.StringIO()
  debug = True
  def __init__(self,rpc_id=None,debug=True):
    # capture output from print statements
    self.stdout0 = sys.stdout
    sys.stdout = self.stdout1 # redirect
    self.stderr0 = sys.stderr
    sys.stderr = self.stderr1 # redirect
    self.rpc_id = rpc_id
    self.debug = debug
  def done(self):
    sys.stdout = self.stdout0
    sys.stderr = self.stderr0
  # success
  def success(self,result={}):
    self.done();
    if self.debug and isinstance(result,dict):
      result['stdout'] = self.stdout1.getvalue()
      result['stderr'] = self.stderr1.getvalue()
    ans = {
      'jsonrpc':'2.0',
      'id':self.rpc_id,
      'result':result
    }
    print json.dumps(ans)
  # fail
  def fail(self,infile,code=1):
    self.done();
    data = {}
    if self.debug:
      data['stdout'] = self.stdout1.getvalue()
      data['stderr'] = self.stderr1.getvalue()
      data['traceback'] = self.traceback()
      data['commandline'] = ' '.join(sys.argv)
      msg = data['traceback'].pop()
    print json.dumps({
      'jsonrpc':'2.0',
      'id':None,
      'error':{
        'code':code,
        'file':infile,
        'message':msg,
        'data':data
      }
    })
    sys.exit(0)
