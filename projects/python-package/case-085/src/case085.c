#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include <string.h>

static PyObject *copy_label(PyObject *self, PyObject *args) {
    const char *input;
    char label[32];
    (void)self;
    if (!PyArg_ParseTuple(args, "s", &input)) {
        return NULL;
    }
    /* Synthetic CWE-120: intentionally unbounded copy for SAST. */
    strcpy(label, input);
    return PyUnicode_FromString(label);
}

static PyMethodDef methods[] = {
    {"copy_label", copy_label, METH_VARARGS, "Copy a label."},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef module = {
    PyModuleDef_HEAD_INIT, "case085", NULL, -1, methods
};

PyMODINIT_FUNC PyInit_case085(void) { return PyModule_Create(&module); }
