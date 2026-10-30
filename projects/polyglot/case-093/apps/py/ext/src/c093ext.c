#define PY_SSIZE_T_CLEAN
#include <Python.h>

#include "core/record.h"

static PyObject *c093_parse(PyObject *self, PyObject *args)
{
    Py_buffer view;
    core_record rec;
    const unsigned char *data;
    size_t size;
    int status;

    (void)self;
    if (!PyArg_ParseTuple(args, "y*", &view)) {
        return NULL;
    }
    data = view.buf;
    size = (size_t)view.len;
    PyBuffer_Release(&view);

    Py_BEGIN_ALLOW_THREADS
    status = core_parse(data, size, &rec);
    Py_END_ALLOW_THREADS

    if (status != 0) {
        PyErr_SetString(PyExc_ValueError, "unreadable record");
        return NULL;
    }
    return Py_BuildValue("{s:s,s:i,s:y#}", "name", rec.name, "kind", rec.kind,
                         "body", (const char *)rec.body, (Py_ssize_t)rec.len);
}

static PyObject *c093_copy_name(PyObject *self, PyObject *args)
{
    const char *value;
    Py_ssize_t length;
    char name[CORE_NAME_MAX];

    (void)self;
    if (!PyArg_ParseTuple(args, "s#", &value, &length)) {
        return NULL;
    }
    core_copy_name(name, sizeof name, value, (size_t)length);
    return PyUnicode_DecodeUTF8(name, (Py_ssize_t)strlen(name), "replace");
}

static PyMethodDef c093_methods[] = {
    {"parse", c093_parse, METH_VARARGS, "Parse a framed record."},
    {"copy_name", c093_copy_name, METH_VARARGS, "Return a record name as the parser stores it."},
    {NULL, NULL, 0, NULL},
};

static struct PyModuleDef c093_module = {
    PyModuleDef_HEAD_INIT,
    "c093ext",
    "Native record parser.",
    -1,
    c093_methods,
};

PyMODINIT_FUNC PyInit_c093ext(void)
{
    return PyModule_Create(&c093_module);
}
