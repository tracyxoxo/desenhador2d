import math
import uuid


class Canvas:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.pixels = [[False for _ in range(width)] for _ in range(height)]

    def set_pixel(self, x, y, on=True):
        if 0 <= x < self.width and 0 <= y < self.height:
            self.pixels[y][x] = bool(on)

    def get_pixel(self, x, y):
        if 0 <= x < self.width and 0 <= y < self.height:
            return self.pixels[y][x]
        return False

    def clear(self):
        for y in range(self.height):
            for x in range(self.width):
                self.pixels[y][x] = False

    def to_list(self):
        return self.pixels


class Primitive:
    def __init__(self, kind, params):
        self.id = str(uuid.uuid4())
        self.kind = kind
        self.params = params

    def draw(self, canvas: Canvas):
        raise NotImplementedError()


class Point(Primitive):
    def __init__(self, x, y):
        super().__init__("point", {"x": x, "y": y})

    def draw(self, canvas: Canvas):
        canvas.set_pixel(self.params["x"], self.params["y"], True)


class Line(Primitive):
    def __init__(self, x0, y0, x1, y1):
        super().__init__("line", {"x0": x0, "y0": y0, "x1": x1, "y1": y1})

    def draw(self, canvas: Canvas):
        x0 = int(self.params["x0"])
        y0 = int(self.params["y0"])
        x1 = int(self.params["x1"])
        y1 = int(self.params["y1"])
        dx = abs(x1 - x0)
        dy = abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx - dy

        while True:
            canvas.set_pixel(x0, y0, True)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 > -dy:
                err -= dy
                x0 += sx
            if e2 < dx:
                err += dx
                y0 += sy


class Circle(Primitive):
    def __init__(self, xc, yc, r):
        super().__init__("circle", {"xc": xc, "yc": yc, "r": r})

    def draw(self, canvas: Canvas):
        xc = int(self.params["xc"])
        yc = int(self.params["yc"])
        r = int(self.params["r"])
        x = 0
        y = r
        d = 1 - r
        self._plot_circle_points(canvas, xc, yc, x, y)
        while x < y:
            x += 1
            if d < 0:
                d += 2 * x + 1
            else:
                y -= 1
                d += 2 * (x - y) + 1
            self._plot_circle_points(canvas, xc, yc, x, y)

    def _plot_circle_points(self, canvas, xc, yc, x, y):
        pts = [
            (xc + x, yc + y), (xc - x, yc + y), (xc + x, yc - y), (xc - x, yc - y),
            (xc + y, yc + x), (xc - y, yc + x), (xc + y, yc - x), (xc - y, yc - x)
        ]
        for px, py in pts:
            canvas.set_pixel(px, py, True)


class Rect(Primitive):
    def __init__(self, x, y, w, h):
        super().__init__("rect", {"x": x, "y": y, "w": w, "h": h})

    def draw(self, canvas: Canvas):
        x = int(self.params["x"])
        y = int(self.params["y"])
        w = int(self.params["w"])
        h = int(self.params["h"])
        Line(x, y, x + w - 1, y).draw(canvas)
        Line(x, y, x, y + h - 1).draw(canvas)
        Line(x + w - 1, y, x + w - 1, y + h - 1).draw(canvas)
        Line(x, y + h - 1, x + w - 1, y + h - 1).draw(canvas)


class Triangle(Primitive):
    def __init__(self, x0, y0, x1, y1, x2, y2):
        super().__init__("triangle", {"x0": x0, "y0": y0, "x1": x1, "y1": y1, "x2": x2, "y2": y2})

    def draw(self, canvas: Canvas):
        Line(self.params["x0"], self.params["y0"], self.params["x1"], self.params["y1"]).draw(canvas)
        Line(self.params["x1"], self.params["y1"], self.params["x2"], self.params["y2"]).draw(canvas)
        Line(self.params["x2"], self.params["y2"], self.params["x0"], self.params["y0"]).draw(canvas)


class ED:
    def __init__(self):
        self.items = []

    def add(self, prim: Primitive):
        self.items.append(prim)
        return prim

    def create_from_payload(self, payload: dict):
        kind = payload.get("type")
        if not kind:
            raise ValueError('missing "type" in payload')

        def get_int(key):
            if key not in payload:
                raise ValueError(f'missing "{key}"')
            try:
                return int(payload[key])
            except Exception:
                raise ValueError(f'invalid integer for "{key}"')

        if kind == "point":
            x = get_int("x"); y = get_int("y")
            p = Point(x, y)
        elif kind == "line":
            x0 = get_int("x0"); y0 = get_int("y0"); x1 = get_int("x1"); y1 = get_int("y1")
            p = Line(x0, y0, x1, y1)
        elif kind == "circle":
            xc = get_int("xc"); yc = get_int("yc"); r = get_int("r")
            p = Circle(xc, yc, r)
        elif kind == "rect":
            x = get_int("x"); y = get_int("y"); w = get_int("w"); h = get_int("h")
            p = Rect(x, y, w, h)
        elif kind == "triangle":
            x0 = get_int("x0"); y0 = get_int("y0"); x1 = get_int("x1"); y1 = get_int("y1"); x2 = get_int("x2"); y2 = get_int("y2")
            p = Triangle(x0, y0, x1, y1, x2, y2)
        else:
            raise ValueError(f'unknown primitive type "{kind}"')

        return self.add(p)

    def to_list(self):
        return [{"id": p.id, "type": p.kind, "params": p.params} for p in self.items]

    def redraw(self, canvas: Canvas, kind: str = "all"):
        for p in self.items:
            if kind == "all" or p.kind == kind:
                p.draw(canvas)
