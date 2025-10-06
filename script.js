document.addEventListener('DOMContentLoaded', () => {
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const generateBtn = document.getElementById('generate-btn');
    const outputArea = document.getElementById('output-area');
    const downloadAllBtn = document.getElementById('download-all-btn');

    let uploadedImage = null;
    let cutImages = [];

    // Gestion du glisser-déposer
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('active'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('active'), false);
    });

    dropArea.addEventListener('drop', handleDrop, false);

    // Clic sur la zone de dépôt
    dropArea.addEventListener('click', () => fileInput.click());

    // Gestion de l'input de fichier
    fileInput.addEventListener('change', handleFileSelect);

    // Gestion du clic sur le bouton "Générer"
    generateBtn.addEventListener('click', generateCuts);

    // Gestion du clic sur le bouton "Télécharger tout"
    downloadAllBtn.addEventListener('click', downloadAll);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        const file = files[0];
        if (!file || !file.type.startsWith('image/')) {
            alert("Veuillez déposer un fichier image valide.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                uploadedImage = img;
                generateBtn.disabled = false;
                outputArea.innerHTML = '';
                downloadAllBtn.style.display = 'none';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

        function generateCuts() {
        if (!uploadedImage) return;

        outputArea.innerHTML = '';
        cutImages = [];

        const img = uploadedImage;
        const imgWidth = img.width;
        const imgHeight = img.height;
        const cutMode = document.querySelector('input[name="cut-mode"]:checked').value;

        const sliceWidth = imgHeight; // La largeur de chaque tranche est toujours égale à la hauteur de l'image
        let startXPositions = [];

        if (cutMode === '1:1') {
            startXPositions = [0, sliceWidth, sliceWidth * 2];
        } else { // '0.75'
            const offset = imgHeight * 0.75;
            startXPositions = [0, offset, offset * 2];
        }

        const totalCutWidth = startXPositions[startXPositions.length - 1] + sliceWidth;
        const optimalWarning = totalCutWidth > imgWidth;

        if (optimalWarning) {
            alert("Attention : La largeur totale des tranches dépasse la largeur de l'image, la dernière partie pourrait être incomplète.");
        }

        for (let i = 0; i < 3; i++) {
            const startX = startXPositions[i];
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = sliceWidth;
            canvas.height = imgHeight;

            // Dessiner la partie de l'image sur le canvas
            ctx.drawImage(img, startX, 0, sliceWidth, imgHeight, 0, 0, sliceWidth, imgHeight);

            const imageDataURL = canvas.toDataURL('image/jpeg');
            cutImages.push({
                dataURL: imageDataURL,
                name: `image-partie${i + 1}.jpg`
            });

            // Afficher l'image découpée
            const container = document.createElement('div');
            container.className = 'cut-image-container';

            const cutImg = document.createElement('img');
            cutImg.src = imageDataURL;
            cutImg.alt = `Partie ${i + 1}`;

            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-individual-btn';
            downloadBtn.textContent = `Télécharger partie ${i + 1}`;
            downloadBtn.onclick = () => downloadImage(imageDataURL, `image-partie${i + 1}.jpg`);

            container.appendChild(cutImg);
            container.appendChild(downloadBtn);

            // Ajouter le message d'avertissement si nécessaire
            if (optimalWarning) {
                const warningSpan = document.createElement('span');
                warningSpan.className = 'optimal-warning';
                warningSpan.textContent = "Largeur non optimale";
                container.appendChild(warningSpan);
            }

            outputArea.appendChild(container);
        }

        downloadAllBtn.style.display = 'block';
    }

    function downloadImage(dataURL, filename) {
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async function downloadAll() {
        const zip = new JSZip();
        for (const img of cutImages) {
            const response = await fetch(img.dataURL);
            const blob = await response.blob();
            zip.file(img.name, blob);
        }

        zip.generateAsync({ type: "blob" })
            .then(function(content) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(content);
                link.download = "images-decoupees.zip";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    }
});