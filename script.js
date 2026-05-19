document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskList = document.getElementById("task-list");
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  // normaliza dados antigos (strings) para objetos { text, completed }
  tasks = tasks.map((t) =>
    typeof t === "string" ? { text: t, completed: false } : t,
  );

  function renderTasks() {
    taskList.innerHTML = "";
    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      if (task.completed) li.classList.add("completed");
      li.innerHTML = `
      <label class="task-row">
        <input type="checkbox" class="done-checkbox" onclick="toggleComplete(${index})" ${task.completed ? "checked" : ""} />
        <span>${task.text}</span>
      </label>
      <div class="actions">
        <button class="edit-btn" onclick="editTask(${index})"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg></button>
        <button class="delete-btn" onclick="deleteTask(${index})"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
    `;
      taskList.appendChild(li);
    });
    saveTasks();
    // atualiza cor das partículas de acordo com proporção de tarefas concluídas
    const total = tasks.length || 0;
    const done = tasks.filter((t) => t.completed).length || 0;
    const ratio = total === 0 ? 0 : done / total;
    if (window.updateParticleColors) window.updateParticleColors(ratio);
  }

  //salvar tarefas no localstorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  //adicionar tarefa
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (taskInput.value.trim()) {
      tasks.push({ text: taskInput.value.trim(), completed: false });
      taskInput.value = "";
      renderTasks();
    }
  });
  //editar tarefa
  window.editTask = (index) => {
    const newTask = prompt("Editar Tarefa:", tasks[index].text);
    if (newTask !== null) {
      tasks[index].text = newTask.trim();
      renderTasks();
    }
  };
  //excluir tarefa
  window.deleteTask = (index) => {
    if (confirm("Deseja excluir esta tarefa?")) {
      tasks.splice(index, 1);
      renderTasks();
    }
  };
  // alternar concluído
  window.toggleComplete = (index) => {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
  };
  renderTasks();
  // --- Particle background ---
  (function initParticles() {
    const canvas = document.getElementById("bg-canvas");
    const ctx = canvas.getContext("2d");

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const palette = ["#e9c9ff", "blueviolet", "#f8eaff", "#4caf50", "#2196f3"];
    const completedColors = ["#4caf50", "#9be6a6", "#76c893"];
    let completedRatio = 0;

    function pickColor() {
      if (Math.random() < completedRatio) {
        return completedColors[
          Math.floor(Math.random() * completedColors.length)
        ];
      }
      return palette[Math.floor(Math.random() * palette.length)];
    }

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = (Math.random() - 0.5) * 0.6;
        this.size = Math.random() * 3 + 1;
        this.life = Math.random() * 80 + 60;
        this.ttl = this.life;
        this.color = pickColor();
        this.alpha = Math.random() * 0.6 + 0.2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.ttl--;
        if (
          this.x < -50 ||
          this.x > window.innerWidth + 50 ||
          this.y < -50 ||
          this.y > window.innerHeight + 50 ||
          this.ttl <= 0
        ) {
          this.reset();
        }
      }
      draw(ctx) {
        ctx.beginPath();
        const g = ctx.createRadialGradient(
          this.x,
          this.y,
          0,
          this.x,
          this.y,
          this.size * 6,
        );
        g.addColorStop(0, this.color);
        g.addColorStop(0.6, this.color + "55");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.globalAlpha = this.alpha;
        ctx.fillRect(
          this.x - this.size * 6,
          this.y - this.size * 6,
          this.size * 12,
          this.size * 12,
        );
        ctx.globalAlpha = 1;
      }
    }

    let particles = [];
    function createParticles(count) {
      particles = [];
      for (let i = 0; i < count; i++) particles.push(new Particle());
    }

    // allow external code to update the completed ratio and recolor particles
    window.updateParticleColors = function (ratio) {
      completedRatio = Math.max(0, Math.min(1, ratio || 0));
      // recolor existing particles based on new ratio
      for (const p of particles) {
        if (Math.random() < completedRatio) {
          p.color =
            completedColors[Math.floor(Math.random() * completedColors.length)];
        } else {
          p.color = palette[Math.floor(Math.random() * palette.length)];
        }
      }
    };

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }
      ctx.globalCompositeOperation = "source-over";
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", () => {
      resize();
      createParticles(
        Math.round((window.innerWidth * window.innerHeight) / 40000),
      );
    });

    resize();
    createParticles(
      Math.round((window.innerWidth * window.innerHeight) / 40000),
    );
    animate();
  })();
});
