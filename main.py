from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from models import Canvas, ED

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")

WIDTH, HEIGHT = 64, 48

canvas = Canvas(WIDTH, HEIGHT)
ed = ED()


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return FileResponse("static/index.html")


@app.get("/state")
async def get_state():
    return {"width": WIDTH, "height": HEIGHT, "pixels": canvas.to_list(), "ed": ed.to_list()}


@app.post("/pixel")
async def set_pixel(payload: dict):
    x = int(payload.get("x"))
    y = int(payload.get("y"))
    on = bool(payload.get("on"))
    if 0 <= x < WIDTH and 0 <= y < HEIGHT:
        canvas.set_pixel(x, y, on)
        return JSONResponse({"ok": True})
    return JSONResponse({"ok": False, "error": "out_of_bounds"}, status_code=400)


@app.post("/primitive")
async def add_primitive(payload: dict):
    try:
        p = ed.create_from_payload(payload)
    except ValueError as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=400)
    return JSONResponse({"ok": True, "id": p.id})


@app.post("/redraw")
async def redraw(payload: dict):
    kind = payload.get("kind", "all")
    canvas.clear()
    ed.redraw(canvas, kind)
    return JSONResponse({"ok": True})


@app.post("/clear")
async def clear():
    canvas.clear()
    return JSONResponse({"ok": True})


@app.get("/ed")
async def get_ed():
    return ed.to_list()
