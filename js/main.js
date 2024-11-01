document.addEventListener("DOMContentLoaded", () => {
    let guessedWords = [[]];
    let availableSpace = 1;

    let words = ["robo", "virus", "acoso", "fraude", "segura", "phishing", "estafa", "cuentas", "links"];
    let usedWords = [];
    let MAX_WORDS = 10;

    let isCurrentWordSubmitted = false;

    let submittedWords = [];

    let currentWordIndex = 1;

    let correctGuesses = 0;

    let isAnimating = false;
    let canDelete = true;

    let isAnimationRunning = false;

    let isSubmitting = false;

    let word = getNewWord();
    let wordLength = word.length;

    let guessedWordCount = 0;

    const keys = document.querySelectorAll(".keyboard-row button");

    createSquares();

    function getNewWord() {
        let remainingWords = words.filter(w => !usedWords.includes(w));
        if (remainingWords.length === 0) {
            showCompletionModal();
            return; // O hacer un reload del juego
        }
        let newWord = remainingWords[Math.floor(Math.random() * remainingWords.length)];
        usedWords.push(newWord); // Añadimos la palabra a la lista de usadas
        return newWord;
    }

    async function checkWordInWiktionary(word) {
        const url = `https://es.wiktionary.org/w/api.php?action=query&titles=${word}&format=json&origin=*`;
    
        try {
            const response = await fetch(url);
            const data = await response.json();
    
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
    
            if (pageId === "-1") {
                // La palabra no existe en Wiktionary
                return false;
            } else {
                // La palabra existe en Wiktionary
                return true;
            }
        } catch (error) {
            console.error("Error al consultar Wiktionary:", error);
            return false;
        }
    }

    function getLetterCount(word) {
        const letterCount = {};
        for (const letter of word) {
                letterCount[letter] = (letterCount[letter] || 0) + 1;
            }
        return letterCount;
    }

    function checkWord(guessedWord, correctWord) {
        const correctLetterCount = getLetterCount(correctWord);
    const result = Array(guessedWord.length).fill("gray"); // Inicializa el resultado en gris

    // Primero, verifica las letras en la posición correcta
    for (let i = 0; i < guessedWord.length; i++) {
        if (guessedWord[i] === correctWord[i]) {
            result[i] = "green"; // Marca la letra como verde
            correctLetterCount[guessedWord[i]]--; // Reduce el conteo de letras
        }
    }

    // Luego, verifica las letras en la posición incorrecta
    for (let i = 0; i < guessedWord.length; i++) {
        if (result[i] === "gray" && correctLetterCount[guessedWord[i]] > 0) {
            result[i] = "yellow"; // Marca la letra como amarilla
            correctLetterCount[guessedWord[i]]--; // Reduce el conteo de letras
        }
    }

    return result;
    }

    function getCurrentWordArr(){
        const numberOfGuessedWords = guessedWords.length;
        return guessedWords[numberOfGuessedWords - 1];
    }

    function updateGuessedWords(letter) {
        const currentWordArr = getCurrentWordArr();

        if (currentWordArr && currentWordArr.length < wordLength) {
            currentWordArr.push(letter);

            const availableSpaceEl = document.getElementById(String(availableSpace));
            availableSpace = availableSpace + 1;
            
            availableSpaceEl.textContent = letter;
        }
    }

    function resetBoard() {
        const tiles = document.querySelectorAll(".tile");
        tiles.forEach(tile => {
            tile.textContent = "";
            tile.classList.remove("correct", "present", "absent");  // Remueve las clases de color si las estás usando
        });
    
        // Opcionalmente, puedes reiniciar el índice de la palabra actual o cualquier otro estado relacionado con el tablero
        currentRow = 0;
        currentTile = 0;
    }

    function getTileColor(letter, index, currentWordArr, wordStatus) {
        const correctLetterCountMap = {};
    const wordStatusLocal = {};

    // Paso 1: Identificamos las letras verdes (posiciones correctas)
    for (let i = 0; i < word.length; i++) {
        const wordLetter = word[i];
        const guessLetter = currentWordArr[i];

        // Crea un mapa con la cantidad de cada letra en la palabra correcta
        correctLetterCountMap[wordLetter] = (correctLetterCountMap[wordLetter] || 0) + 1;

        // Si la letra es correcta en posición, se marca verde
        if (guessLetter === wordLetter) {
            wordStatusLocal[guessLetter] = (wordStatusLocal[guessLetter] || 0) + 1;
        }
    }

    // Paso 2: Procesar el color para cada letra
    const letterInThatPosition = word.charAt(index);
    const isCorrectLetter = word.includes(letter);
    const isCorrectPosition = letter === letterInThatPosition;

    // Si la letra es verde (correcta y en la posición correcta)
    if (isCorrectPosition) {
        return "rgb(83, 141, 78)"; // Verde
    }

    // Si la letra está en la palabra pero no en la posición correcta (posible amarilla)
    if (isCorrectLetter) {
        const totalUsedInGuess = wordStatusLocal[letter] || 0;
        const totalCorrectInWord = correctLetterCountMap[letter] || 0;

        if (totalUsedInGuess < totalCorrectInWord) {
            wordStatusLocal[letter] = (wordStatusLocal[letter] || 0) + 1;
            return "rgb(181, 159, 59)"; // Amarillo
        }
    }

    // Si la letra no está en la palabra
    return "rgb(58, 58, 60)";
    }

    async function handleSubmitWord() {
        if (isSubmitting) return;  // Evita duplicados
    isSubmitting = true;

    const currentWordArr = getCurrentWordArr();
    if (currentWordArr.length !== wordLength) {
        window.alert(`La palabra debe tener ${wordLength} letras`);
        isSubmitting = false;  // Libera la entrada en caso de error
        return;
    }

    const currentWord = currentWordArr.join("");
    const isValidWord = await checkWordInWiktionary(currentWord);

    if (!isValidWord) {
        window.alert("La palabra no está en el diccionario");
        isSubmitting = false;  // Libera la entrada en caso de error
        return;
    }

    submittedWords.push(currentWord);
    isCurrentWordSubmitted = true;

    const firstLetterId = guessedWordCount * wordLength + 1;
    const interval = 100;
    let wordStatus = {};

    // Animación y cambio de color en letras
    currentWordArr.forEach((letter, index) => {
        setTimeout(() => {
            const tileColor = getTileColor(letter, index, currentWordArr, wordStatus);
            const letterId = firstLetterId + index;
            const letterEl = document.getElementById(letterId);
            letterEl.classList.add("animate__flipInX");
            letterEl.style = `background-color: ${tileColor}; border-color: ${tileColor}`;
        }, interval * index);
    });

    await new Promise(resolve => setTimeout(resolve, interval * currentWordArr.length));

    guessedWordCount += 1;

    if (currentWord === word) {
        handleCorrectWord();
    } else if (guessedWordCount === 6) {
        window.alert(`Lo siento, ¡no tienes más intentos! La palabra es ${word}.`);
        loadNextWord();
        isSubmitting = false;
        return;
    }

    if (usedWords.length === MAX_WORDS) {
        showCompletionModal();
        isSubmitting = false;
        return;
    }

    guessedWords.push([]);
    isSubmitting = false;
    }

    function createSquares() {
        const board = document.getElementById("board");

        board.style.gridTemplateColumns = `repeat(${wordLength}, 1fr)`;

        board.innerHTML = "";

        for (let index = 0; index < wordLength * 6; index++) {
            let square = document.createElement("div");
            square.classList.add("square");
            square.classList.add("animate__animated");
            square.setAttribute("id", index + 1);
            board.appendChild(square);
        }
    }

    function loadNextWord() {
        if (usedWords.length === MAX_WORDS) { // Si ya usamos todas las palabras, mostramos el modal
            showCompletionModal();
            return;
        }
        
        resetBoard();
    
        guessedWords = [[]];
        availableSpace = 1;
        guessedWordCount = 0;
    
        word = getNewWord();
        wordLength = word.length;
    
        submittedWords = []; // Reiniciar el estado al cargar una nueva palabra
    
        createSquares(); // Resetear el tablero
    }

    function updateWordProgress() {
        const progressEl = document.getElementById("word-progress");
        progressEl.textContent = `${currentWordIndex}/${words.length}`;
    }

    function showCompletionModal() {
        const modal = document.getElementById("completion-modal");
        const correctCount = document.getElementById("correct-count");
        correctCount.textContent = `¡Has acertado ${correctGuesses} de ${words.length} palabras!`;
        modal.style.display = "block";
    }

    function checkCompletion() {
        // Verifica si todas las palabras han sido adivinadas
        if (correctGuesses.length === words.length) {
            showCompletionModal();
        }
    }
    function guessWord(guessedWord) {
        // Verifica si la palabra adivinada es correcta y no ha sido adivinada antes
        if (words.includes(guessedWord) && !correctGuesses.includes(guessedWord)) {
            correctGuesses.push(guessedWord);
        } else {
            alert("Esa palabra ya ha sido adivinada o no está en la lista.");
        }
    
        // Llama a checkCompletion después de procesar la adivinanza
        checkCompletion();
    }

    document.getElementById("play-again-button").addEventListener("click", () => {
        correctWordsCount = 0; // Reiniciar el conteo de palabras acertadas
        usedWords = []; // Reiniciar las palabras usadas
        const modal = document.getElementById("completion-modal");
        modal.style.display = "none"; // Cerrar el modal
        loadNextWord(); // Cargar la primera palabra
    });

    function handleCorrectWord() {
        correctGuesses += 1;
        currentWordIndex += 1;  // Incrementamos el índice al acertar

        updateWordProgress();  // Actualizamos el progreso en pantalla

    // Mostrar el modal de ganancia solo si no es la última palabra
        if (currentWordIndex < MAX_WORDS) {  
            const modal = document.getElementById("win-modal");
            modal.style.display = "block";
        } else {
            showCompletionModal();
        }
    }

    document.getElementById("restart-button").addEventListener("click", () => {
        const modal = document.getElementById("win-modal");
        modal.style.display = "none";
        loadNextWord(); // Cargar la siguiente palabra cuando se gana
    });

    function handleDeleteLetter() {
        const currentWordArr = getCurrentWordArr();

    // Verifica si la palabra actual ha sido enviada
    if (submittedWords.length > 0 && submittedWords[submittedWords.length - 1] === currentWordArr.join("")) {
        window.alert("No puedes borrar letras de una palabra ya enviada");
        return;
    }

    if (currentWordArr.length === 0) {
        window.alert("No puedes borrar más");
        return;
    }

    const removedLetter = currentWordArr.pop();
    guessedWords[guessedWords.length - 1] = currentWordArr;

    const lastLetterEl = document.getElementById(String(availableSpace - 1));
    lastLetterEl.textContent = '';
    availableSpace = availableSpace - 1;
    }

    function handleKeyClick(key) {
        if (isSubmitting) return;

        if (key === "enter") {
            handleSubmitWord();
            return;
        }
    
        if (key === "del") {
            handleDeleteLetter();
            return;
        }
    
        updateGuessedWords(key);
    }


    for (let i = 0; i < keys.length; i++) {
        keys[i].onclick = ({ target }) => {
            const letter = target.getAttribute("data-key");
            handleKeyClick(letter);
        };
    }

    document.addEventListener("keydown", (event) => {
        const key = event.key.toLowerCase();

        // Validar si la tecla presionada es una letra o "Enter" o "Backspace"
        if (key === "enter") {
            handleKeyClick("enter");
        } else if (key === "backspace") {
            handleKeyClick("del");
        } else if (/^[a-zñ]$/.test(key)) {  // Solo letras de la a a la z o la ñ
            handleKeyClick(key);
        }
    });

    function deleteLetter() {
        const currentWordArr = getCurrentWordArr();
        if (currentWordArr.length > 0) {
            currentWordArr.pop();

            availableSpace = availableSpace - 1;
            const availableSpaceEl = document.getElementById(String(availableSpace));
            availableSpaceEl.textContent = "";
        }
    }
});

window.addEventListener("DOMContentLoaded", () => {
    const playAgainButton = document.getElementById("play-again-button");
    playAgainButton.addEventListener("click", () => {
        location.reload(); // Recargar la página
    });
});
