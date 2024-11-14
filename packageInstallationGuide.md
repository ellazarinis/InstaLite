PUT |WORKING| installation directions for ALL OF THE RANDOM PACKAGES YOU INSTALL


LEFTY Face recognition modules

0. **Install this thing:**
    apt install -y libhdf5-serial-dev

1. **Install pkg-config:**
   If you are using a Debian-based system (like Ubuntu), you can install `pkg-config` using:
   ```
   sudo apt-get install pkg-config
   ```

   For other systems, you'll need to use the appropriate package manager (e.g., `yum` for CentOS, `brew` for macOS).

2. **Install HDF5 libraries:**
   After installing `pkg-config`, make sure you have the HDF5 libraries installed. You can install them on a Debian-based system with:
   ```
   sudo apt-get install libhdf5-dev
   ```

   This will provide the necessary headers and libraries for `h5py` to compile against.

3. **installing h5py:**
   Once `pkg-config` and `libhdf5-dev` are installed, try installing `h5py` again:
   ```
   pip3 install h5py
   ```
4. **installing TensorFlow:**
    pip install tensorflow

5. **Run this thing:**
    npm rebuild @tensorflow/tfjs-node --build-from-source bash ./download-models.sh

KIDUS: FORGOT PASSWORD EMAIL SENDING API:

1. **Install nodeMailer:**
   npm install nodemailer