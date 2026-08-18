import urllib.request, json, sys, time
url='http://127.0.0.1:8000'
primitives = [
    {'type':'point','x':2,'y':2},
    {'type':'line','x0':5,'y0':5,'x1':20,'y1':5},
    {'type':'circle','xc':10,'yc':15,'r':5},
    {'type':'rect','x':25,'y':5,'w':8,'h':6},
    {'type':'triangle','x0':40,'y0':5,'x1':45,'y1':15,'x2':35,'y2':15},
]

for p in primitives:
    print('POST', p)
    req = urllib.request.Request(url + '/primitive', data=json.dumps(p).encode('utf-8'), headers={'Content-Type':'application/json'})
    try:
        r = urllib.request.urlopen(req)
        print('->', r.status, r.read().decode())
    except Exception as e:
        print('primitive post error', e)
        continue
    time.sleep(0.1)
    # redraw all
    try:
        r = urllib.request.urlopen(urllib.request.Request(url + '/redraw', data=json.dumps({'kind':'all'}).encode('utf-8'), headers={'Content-Type':'application/json'}))
        print('redraw ->', r.status)
    except Exception as e:
        print('redraw error', e)
        continue
    time.sleep(0.1)
    # get state
    try:
        r = urllib.request.urlopen(url + '/state')
        st = json.loads(r.read().decode())
    except Exception as e:
        print('state error', e); continue
    print('ED:', st.get('ed'))
    pixels = st.get('pixels')
    # print a small region 0..29 rows, 0..59 cols
    for y in range(0, 30):
        row = ''.join('#' if pixels[y][x] else '.' for x in range(0, 60))
        print(row)
    print('\n' + '='*60 + '\n')
    time.sleep(0.2)
print('done')
