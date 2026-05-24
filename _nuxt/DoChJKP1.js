const drag = {
  mounted(el, binding) {
    if (binding.value == false) {
      return;
    }
    const _data = {
      draggableElementId: null,
      down: false,
      cursorPreviousX: 0,
      cursorPreviousY: 0,
      overlay: null,
      // Track velocities for inertia
      velocityX: 0,
      velocityY: 0,
      // Track positions for velocity calculation
      positions: [],
      // Animation frame for inertia
      inertiaAnimationId: null
    };
    function createOverlay(e, el2, _data2) {
      const overlay = document.createElement("div");
      overlay.setAttribute("style", `
        width: 100vw; 
        height: 100vh; 
        position: fixed;
        top: 0;
        left: 0;
        z-index: 999999999999;
        touch-action: none;
      `);
      overlay.addEventListener("mouseup", (e2) => mouseup(e2, el2, _data2));
      overlay.addEventListener("mouseleave", (e2) => mouseup(e2, el2, _data2));
      overlay.addEventListener("mousedown", (e2) => mousedown(e2, el2, _data2));
      overlay.addEventListener("mousemove", (e2) => mousemove(e2, el2, _data2));
      overlay.addEventListener("touchend", (e2) => touchend(e2, el2, _data2), { passive: true });
      overlay.addEventListener("touchstart", (e2) => touchstart(e2, el2, _data2), { passive: true });
      overlay.addEventListener("touchmove", (e2) => touchmove(e2, el2, _data2), { passive: true });
      document.body.appendChild(overlay);
      return overlay;
    }
    function checkIfIdInPath(id, path) {
      for (let i = 0; i < path.length; i++) {
        if (path[i].id === id) {
          return true;
        }
      }
      return false;
    }
    function trackPosition(x, y, time) {
      _data.positions.push({ x, y, time });
      if (_data.positions.length > 5) {
        _data.positions.shift();
      }
    }
    function calculateVelocity() {
      if (_data.positions.length < 2) return { x: 0, y: 0 };
      const newest = _data.positions[_data.positions.length - 1];
      const oldest = _data.positions[0];
      const timeDiff = (newest.time - oldest.time) / 1e3;
      if (timeDiff === 0) return { x: 0, y: 0 };
      return {
        x: (newest.x - oldest.x) / timeDiff,
        y: (newest.y - oldest.y) / timeDiff
      };
    }
    function checkBoundaries(el2, nextX, nextY) {
      const rect = el2.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const newLeft = nextX;
      const newTop = nextY;
      newLeft + rect.width;
      newTop + rect.height;
      const minVisibleWidth = rect.width * 0.2;
      const minVisibleHeight = rect.height * 0.2;
      const adjustedX = Math.min(Math.max(newLeft, -rect.width + minVisibleWidth), viewportWidth - minVisibleWidth);
      const adjustedY = Math.min(Math.max(newTop, -rect.height + minVisibleHeight), viewportHeight - minVisibleHeight);
      return { x: adjustedX, y: adjustedY };
    }
    function applyInertia(el2, customVelocityX, customVelocityY) {
      if (_data.inertiaAnimationId) {
        cancelAnimationFrame(_data.inertiaAnimationId);
      }
      if (customVelocityX !== void 0 && customVelocityY !== void 0) {
        _data.velocityX = customVelocityX;
        _data.velocityY = customVelocityY;
      } else {
        const velocity = calculateVelocity();
        _data.velocityX = velocity.x;
        _data.velocityY = velocity.y;
        if (Math.abs(_data.velocityX) < 50 && Math.abs(_data.velocityY) < 50) {
          return;
        }
      }
      const friction = 0.99;
      const currentPos = el2.getBoundingClientRect();
      let posX = currentPos.left;
      let posY = currentPos.top;
      function inertiaStep() {
        _data.velocityX *= friction;
        _data.velocityY *= friction;
        let deltaX = _data.velocityX * 0.016;
        let deltaY = _data.velocityY * 0.016;
        posX += deltaX;
        posY += deltaY;
        trackPosition(posX, posY, performance.now());
        const boundedPos = checkBoundaries(el2, posX, posY);
        posX = boundedPos.x;
        posY = boundedPos.y;
        const inertiaEvent = new CustomEvent("inertia", {
          detail: {
            inertia: true,
            deltaX,
            deltaY
          }
        });
        el2.dispatchEvent(inertiaEvent);
        if (Math.abs(_data.velocityX) < 0.5 && Math.abs(_data.velocityY) < 0.5) {
          const inertiaEndEvent = new CustomEvent("inertiaend");
          el2.dispatchEvent(inertiaEndEvent);
          return;
        }
        _data.inertiaAnimationId = requestAnimationFrame(inertiaStep);
      }
      const inertiaStartEvent = new CustomEvent("inertiastart", {
        detail: {
          velocityX: _data.velocityX,
          velocityY: _data.velocityY
        }
      });
      el2.dispatchEvent(inertiaStartEvent);
      _data.inertiaAnimationId = requestAnimationFrame(inertiaStep);
    }
    function touchstart(e, el2, _data2) {
      e.preventDefault();
      if (_data2.draggableElementId && !checkIfIdInPath(_data2.draggableElementId, e.composedPath())) {
        return;
      }
      if (_data2.inertiaAnimationId) {
        cancelAnimationFrame(_data2.inertiaAnimationId);
        _data2.inertiaAnimationId = null;
      }
      if (_data2.overlay) {
        _data2.overlay.remove();
      }
      el2.classList.add("dragging");
      const dragEvent = new CustomEvent("draggingstart");
      el2.dispatchEvent(dragEvent);
      _data2.down = true;
      _data2.timestamp = performance.now();
      _data2.cursorStartX = e.touches[0].clientX;
      _data2.cursorStartY = e.touches[0].clientY;
      _data2.cursorPreviousX = e.touches[0].clientX;
      _data2.cursorPreviousY = e.touches[0].clientY;
      _data2.positions = [];
      trackPosition(e.touches[0].clientX, e.touches[0].clientY, performance.now());
    }
    function touchend(e, el2, _data2) {
      e.preventDefault();
      if (_data2.down) {
        _data2.down = false;
        if (isClick()) {
          const clickEvent = new CustomEvent("dragclick", {
            detail: {
              clientX: _data2.cursorPreviousX,
              clientY: _data2.cursorPreviousY
            },
            bubbles: true
          });
          e.target.dispatchEvent(clickEvent);
        } else {
          applyInertia(el2);
        }
        if (_data2.overlay) {
          el2.classList.remove("dragging");
          _data2.overlay.remove();
          const dragEvent = new CustomEvent("draggingend");
          el2.dispatchEvent(dragEvent);
        }
      }
    }
    function touchmove(e, el2, _data2) {
      e.preventDefault();
      if (_data2.down) {
        const touch = e.touches[0];
        const now = performance.now();
        trackPosition(touch.clientX, touch.clientY, now);
        const deltaX = touch.clientX - _data2.cursorPreviousX;
        const deltaY = touch.clientY - _data2.cursorPreviousY;
        const rect = el2.getBoundingClientRect();
        const newX = rect.left + deltaX;
        const newY = rect.top + deltaY;
        const boundedPos = checkBoundaries(el2, newX, newY);
        const dragEvent = new CustomEvent("dragging", {
          detail: {
            deltaX: boundedPos.x - rect.left,
            deltaY: boundedPos.y - rect.top
          }
        });
        el2.dispatchEvent(dragEvent);
        _data2.cursorPreviousX = touch.clientX;
        _data2.cursorPreviousY = touch.clientY;
      }
    }
    function mousedown(e, el2, _data2) {
      if (_data2.draggableElementId && !checkIfIdInPath(_data2.draggableElementId, e.composedPath())) {
        return;
      }
      if (_data2.inertiaAnimationId) {
        cancelAnimationFrame(_data2.inertiaAnimationId);
        _data2.inertiaAnimationId = null;
      }
      if (_data2.overlay) {
        _data2.overlay.remove();
      }
      el2.classList.add("dragging");
      const dragEvent = new CustomEvent("draggingstart");
      el2.dispatchEvent(dragEvent);
      _data2.down = true;
      _data2.timestamp = performance.now();
      _data2.cursorStartX = e.clientX;
      _data2.cursorStartY = e.clientY;
      _data2.cursorPreviousX = e.clientX;
      _data2.cursorPreviousY = e.clientY;
      _data2.positions = [];
      trackPosition(e.clientX, e.clientY, performance.now());
      const overlay = createOverlay(e, el2, _data2);
      _data2.overlay = overlay;
    }
    function mouseup(e, el2, _data2) {
      if (_data2.down) {
        _data2.down = false;
        if (isClick()) {
          const clickEvent = new CustomEvent("dragclick", {
            detail: {
              clientX: _data2.cursorPreviousX,
              clientY: _data2.cursorPreviousY
            },
            bubbles: true
          });
          el2.dispatchEvent(clickEvent);
        } else {
          applyInertia(el2);
        }
        if (_data2.overlay) {
          el2.classList.remove("dragging");
          _data2.overlay.remove();
          const dragEvent = new CustomEvent("draggingend");
          el2.dispatchEvent(dragEvent);
        }
      }
    }
    function mousemove(e, el2, _data2) {
      if (_data2.down) {
        const now = performance.now();
        trackPosition(e.clientX, e.clientY, now);
        const deltaX = e.clientX - _data2.cursorPreviousX;
        const deltaY = e.clientY - _data2.cursorPreviousY;
        const rect = el2.getBoundingClientRect();
        const newX = rect.left + deltaX;
        const newY = rect.top + deltaY;
        const boundedPos = checkBoundaries(el2, newX, newY);
        const dragEvent = new CustomEvent("dragging", {
          detail: {
            deltaX: boundedPos.x - rect.left,
            deltaY: boundedPos.y - rect.top
          }
        });
        el2.dispatchEvent(dragEvent);
        _data2.cursorPreviousX = e.clientX;
        _data2.cursorPreviousY = e.clientY;
      }
    }
    function isClick() {
      if (performance.now() - _data.timestamp > 200) {
        return false;
      }
      if (Math.abs(_data.cursorPreviousX - _data.cursorStartX) > 20) {
        return false;
      }
      if (Math.abs(_data.cursorPreviousY - _data.cursorStartY) > 20) {
        return false;
      }
      return true;
    }
    _data.draggableElementId = binding.arg || null;
    el.addEventListener("mousedown", (e) => mousedown(e, el, _data));
    el.addEventListener("touchstart", (e) => touchstart(e, el, _data), { passive: true });
    el.addEventListener("touchend", (e) => touchend(e, el, _data), { passive: true });
    el.addEventListener("touchmove", (e) => touchmove(e, el, _data), { passive: true });
    el.startInertia = function(velocityX, velocityY) {
      applyInertia(el, velocityX, velocityY);
    };
    el.dragdirectiveunmount = () => {
      if (_data.inertiaAnimationId) {
        cancelAnimationFrame(_data.inertiaAnimationId);
      }
      el.removeEventListener("mouseleave", mouseup);
      el.removeEventListener("mouseup", mouseup);
      el.removeEventListener("mousedown", mousedown);
      el.removeEventListener("mousemove", mousemove);
      el.removeEventListener("touchstart", touchstart);
      el.removeEventListener("touchend", touchend);
      el.removeEventListener("touchmove", touchmove);
      delete el.startInertia;
    };
  },
  beforeUnmount(el) {
    el.dragdirectiveunmount?.();
    delete el.dragdirectiveunmount;
  }
};
export {
  drag as d
};
