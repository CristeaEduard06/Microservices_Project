<script>
  let clientName = "";
  let result = null;
  let searchType = "client";

  let username = '';
let password = '';
let loggedIn = false;

async function login() {
  try {
    const res = await fetch('http://localhost:8080/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      loggedIn = true;
    } else {
      alert("Autentificare eșuată");
    }
  } catch (error) {
    alert("Eroare la autentificare");
  }
}

  async function search() {
    if (!clientName) return;

    const token = localStorage.getItem("token"); // folosește token-ul salvat după login

    try {
      const res = await fetch(`http://localhost:8080/${searchType}/${clientName}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      result = await res.json();
    } catch (e) {
      result = { error: "Clientul sau compania nu a fost găsit sau serverul este oprit." };
    }
  }
</script>

<main class="min-h-screen bg-gray-100 flex items-center justify-center p-4">
  <div class="bg-white shadow-xl rounded-xl p-8 max-w-xl w-full">
    <h1 class="text-3xl font-bold text-center text-indigo-600 mb-6">
      Microservicii ASISSoft
    </h1>

    {#if !loggedIn}
      <!-- LOGIN FORM -->
      <div class="flex flex-col gap-4 mb-6">
        <input
          bind:value={username}
          placeholder="User"
          class="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <input
          bind:value={password}
          type="password"
          placeholder="Parolă"
          class="px-4 py-2 border border-gray-300 rounded-lg"
        />
        <button
          on:click={login}
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg transition"
        >
          Autentifică-te
        </button>
      </div>
    {:else}
      <!-- SEARCH FORM -->
      <div class="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <input
          type="text"
          bind:value={clientName}
          placeholder="Nume client"
          class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <select
          bind:value={searchType}
          class="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="client">Client</option>
          <option value="company">Companie</option>
        </select>
        <button
          on:click={search}
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg transition duration-300"
        >
          Caută
        </button>
      </div>

      {#if result}
        <pre class="bg-gray-100 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
          {JSON.stringify(result, null, 2)}
        </pre>
      {/if}
    {/if}
  </div>
</main>

