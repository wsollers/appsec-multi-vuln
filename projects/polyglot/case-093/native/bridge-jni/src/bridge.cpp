#include <jni.h>

#include <cstdlib>
#include <cstring>

#include "core/record.h"

namespace {

jstring describe_record(JNIEnv *env, const core_record &rec)
{
    char *text = core_describe(&rec, nullptr);
    if (text == nullptr) {
        return nullptr;
    }
    jstring result = env->NewStringUTF(text);
    core_free(text);
    return result;
}

void throw_state(JNIEnv *env, const char *message)
{
    jclass type = env->FindClass("java/lang/IllegalStateException");
    if (type != nullptr) {
        env->ThrowNew(type, message);
    }
}

}  // namespace

extern "C" {

JNIEXPORT jstring JNICALL
Java_org_example_c093_binding_Records_describe(JNIEnv *env, jclass, jbyteArray data, jint offset, jint length)
{
    jbyte *bytes = env->GetByteArrayElements(data, nullptr);
    if (bytes == nullptr) {
        return nullptr;
    }
    core_record rec;
    const auto *start = reinterpret_cast<const unsigned char *>(bytes) + offset;
    int status = core_parse(start, static_cast<size_t>(length), &rec);
    env->ReleaseByteArrayElements(data, bytes, JNI_ABORT);
    if (status != 0) {
        throw_state(env, "unreadable record");
        return nullptr;
    }
    return describe_record(env, rec);
}

JNIEXPORT jstring JNICALL
Java_org_example_c093_binding_Records_label(JNIEnv *env, jclass, jstring name, jint kind)
{
    jsize count = env->GetStringLength(name);
    char *utf = static_cast<char *>(std::malloc(static_cast<size_t>(count) + 1));
    if (utf == nullptr) {
        return nullptr;
    }
    env->GetStringUTFRegion(name, 0, count, utf);
    utf[count] = '\0';

    core_record rec;
    std::memset(&rec, 0, sizeof rec);
    core_copy_name(rec.name, sizeof rec.name, utf, std::strlen(utf));
    rec.kind = kind;
    std::free(utf);
    return describe_record(env, rec);
}

JNIEXPORT jint JNICALL
Java_org_example_c093_binding_Records_fill(JNIEnv *env, jclass, jint rows, jint width, jbyteArray row)
{
    core_table *table = core_table_new(rows, width);
    if (table == nullptr) {
        return -1;
    }
    jsize size = env->GetArrayLength(row);
    jbyte *bytes = env->GetByteArrayElements(row, nullptr);
    jint filled = 0;
    if (bytes != nullptr) {
        for (jint index = 0; index < rows; ++index) {
            if (core_table_put(table, index, reinterpret_cast<const unsigned char *>(bytes),
                               static_cast<size_t>(size)) == 0) {
                ++filled;
            }
        }
        env->ReleaseByteArrayElements(row, bytes, JNI_ABORT);
    }
    core_table_free(table);
    return filled;
}

}  // extern "C"
