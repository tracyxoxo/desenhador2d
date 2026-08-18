import urllib.request, json, sys
url = 'http://127.0.0.1:8000'
# add a line from (5,5) to (20,15)
payload = {"type":"line","x0":5,"y0":5,"x1":20,"y1":15}
req = urllib.request.Request(url+'/primitive', data=json.dumps(payload).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    r = urllib.request.urlopen(req)
    print('primitive status', r.status, r.read().decode())
except Exception as e:
    print('primitive error', e); sys.exit(1)
# redraw
req = urllib.request.Request(url+'/redraw', data=json.dumps({"kind":"all"}).encode('utf-8'), headers={'Content-Type':'application/json'})
try:
    r = urllib.request.urlopen(req)
    print('redraw status', r.status, r.read().decode())
except Exception as e:
    print('redraw error', e); sys.exit(1)
# get state
r = urllib.request.urlopen(url+'/state')
print('state status', r.status)
st = json.loads(r.read().decode())
pixels = st['pixels']
# print a small region
for y in range(0, 22):
    line = ''.join('#' if pixels[y][x] else '.' for x in range(0, 26))
    print(line)
