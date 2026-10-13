<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, sans-serif; color: #333; margin: 0 10px; }
        .subject { color: #888; font-size: 11px; margin-bottom: 6px; }
        h1 { font-size: 22px; margin: 0 0 4px 0; color: #1e1e1e; }
        .source { color: #999; font-size: 10px; margin-bottom: 8px; }
        hr { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
        h2 { font-size: 16px; margin: 12px 0 4px 0; }
        h3 { font-size: 14px; margin: 10px 0 4px 0; }
        h4 { font-size: 12px; margin: 8px 0 4px 0; }
        p, li { font-size: 11px; line-height: 1.5; }
        .tags { color: #999; font-size: 10px; margin-top: 10px; }
        .footer { color: #aaa; font-size: 9px; text-align: right; margin-top: 12px; font-style: italic; }
    </style>
</head>
<body>
    <div class="subject">{{ $entry->subject->name ?? '' }}@if($entry->topic) | {{ $entry->topic }}@endif</div>
    <h1>{{ $strip($entry->title) }}</h1>
    @if($entry->source)<div class="source">Fonte: {{ $entry->source }}</div>@endif
    <hr>
    @php
        $lines = explode("\n", $entry->content);
    @endphp
    @foreach($lines as $line)
        @php $trimmed = trim($line); @endphp
        @if($trimmed === '')
            <div style="height:6px"></div>
        @elseif(str_starts_with($trimmed, '### '))
            <h4>{{ $strip(substr($trimmed, 4)) }}</h4>
        @elseif(str_starts_with($trimmed, '## '))
            <h3>{{ $strip(substr($trimmed, 3)) }}</h3>
        @elseif(str_starts_with($trimmed, '# '))
            <h2>{{ $strip(substr($trimmed, 2)) }}</h2>
        @elseif(str_starts_with($trimmed, '- ') || str_starts_with($trimmed, '* '))
            <p>• {{ $strip(substr($trimmed, 2)) }}</p>
        @elseif(str_starts_with($trimmed, '---') || str_starts_with($trimmed, '***'))
            <hr>
        @elseif(str_starts_with($trimmed, '|'))
            {{-- tabelas markdown ignoradas no PDF --}}
        @else
            <p>{{ $strip($trimmed) }}</p>
        @endif
    @endforeach
    @if(count($tags))
        <hr>
        <div class="tags">Tags: {{ implode(', ', $tags) }}</div>
    @endif
    <div class="footer">Gerado em {{ $entry->created_at?->format('d/m/Y') }}</div>
</body>
</html>
