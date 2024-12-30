#!/bin/bash -e

fatal() { echo "Fatal: $*" 1>&2; exit 1; }

usage() {
cat<<EOF
Usage: $0 COMMAND [OPTIONS]

Commands:
  all                   handle vendor, tailwind
  vendor                download, verify and concatenate vendor files
  tailwind [--watch]    build tailwind.css

EOF
exit 1
}

_vendor_files() {
cat<<EOF
628497cb69df7b1d31236479cad68c9bb3f265060afd5506a0c004b394dfa47e https://unpkg.com/vue@3.3.4/dist/vue.global.prod.js
f0261dc7c1e12d0f8aa980277dc8c16ed1fd8c9e148de66f7cda64a773b9b215 https://unpkg.com/marked@15.0.3/marked.min.js
EOF
}

_vendor_get_verify() {
    SRC="$1"
    DST="$2"
    HASH="$3"
    if [ -f "$DST" ]; then
        echo -n "$HASH  $DST" | sha256sum --strict --check -
        return 0
    fi
    curl -qsL $SRC -o $DST.tmp
    echo -n "$HASH  $DST.tmp" | sha256sum --strict --check -
    mv $DST.tmp $DST
}

_vendor() {
    mkdir -p .vendor
    rm -f vendor.js vendor.css
    command -v curl >/dev/null || fatal "curl not found"
    command -v sha256sum >/dev/null || fatal "sha256sum not found"

    while IFS=' ' read -r HASH SRC; do
        local DST=".vendor/$(basename $SRC)"
        _vendor_get_verify "$SRC" "$DST" "$HASH"
        case "$DST" in
            *.js)  cat "$DST" >> vendor.js ;;
            *.css) cat "$DST" >> vendor.css ;;
        esac
    done < <(_vendor_files)
    [ -e vendor.js ] && sha256sum vendor.js
    [ -e vendor.css ] && sha256sum vendor.css
}

_tailwind() {
    # tailwindcss v3.1.6
    OPTS="$@"
    command -v tailwindcss >/dev/null || fatal "tailwindcss not found"
    [ -e "tailwind.input.css" ] || fatal "tailwind.input.css not found"
    [ -e "tailwind.config.js" ] || fatal "tailwind.config.js not found"
    tailwindcss $OPTS --minify -i tailwind.input.css -o tailwind.css
}

main() {
    cd $(dirname $(realpath $0))
    case $1 in
        ""|-h|--help|help)      usage;;
        all)                    _vendor; _tailwind;;
        vendor)                 _vendor;;
        tailwind)               shift; _tailwind $@;;
        *)                      fatal "unrecognized command: $1";;
    esac
}

main "$@"
